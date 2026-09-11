import express from 'express';
import multer from 'multer';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import cloudinary from '../cloudinary.js';
import {
  normalizeProductWithVariants,
  packageVariantsForStorage,
  getSellerVerticalSettings,
} from '../services/verticalService.js';

const router = express.Router();

// Use memory storage — files are streamed directly to Cloudinary, never touch disk
const storage = multer.memoryStorage();

// File Filter & Size Limit (Max 6 files, 25MB limit per photo)
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, GIF) up to 25MB are allowed.'));
    }
  },
});

/**
 * Uploads a single file buffer to Cloudinary.
 * Returns the secure HTTPS URL of the uploaded image.
 */
function uploadToCloudinary(fileBuffer, mimetype) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'social-media-sellers/products',
        resource_type: 'image',
        format: 'webp',       // Auto-convert to WebP for better performance
        quality: 'auto:good', // Automatic quality optimization
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

/**
 * Extracts the Cloudinary public_id from a secure URL so we can delete it.
 * e.g. "https://res.cloudinary.com/cloud/image/upload/v123/social-media-sellers/products/abc.webp"
 *   -> "social-media-sellers/products/abc"
 */
function extractPublicId(cloudinaryUrl) {
  try {
    const url = new URL(cloudinaryUrl);
    // Pathname: /cloud_name/image/upload/v12345/folder/filename.ext
    const parts = url.pathname.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    // Skip the version segment if present (starts with 'v' + digits)
    let startIndex = uploadIndex + 1;
    if (/^v\d+$/.test(parts[startIndex])) startIndex++;
    const withExt = parts.slice(startIndex).join('/');
    // Strip file extension
    return withExt.replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
}

/**
 * Deletes a list of Cloudinary image URLs from the CDN.
 * Silently ignores failures (non-Cloudinary URLs, already-deleted, etc.)
 */
async function deleteFromCloudinary(imageUrls) {
  await Promise.allSettled(
    imageUrls
      .map(extractPublicId)
      .filter(Boolean)
      .map((publicId) => cloudinary.uploader.destroy(publicId))
  );
}

// Protect ALL product routes with JWT Authentication
router.use(authenticateToken);

// 1. GET ALL PRODUCTS FOR LOGGED-IN SELLER
router.get('/', async (req, res) => {
  try {
    const verticalSettings = getSellerVerticalSettings(req.user.id);
    const products = await db.orm.public.Product.where({ userId: req.user.id }).all();
    const formatted = products.map((p) => normalizeProductWithVariants(p, verticalSettings.vertical));

    res.json({
      status: 'success',
      verticalSettings,
      products: formatted,
    });
  } catch (error) {
    console.error('Fetch Products Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch products.' });
  }
});

// 1.5 GET SINGLE PRODUCT BY ID (FOR DEDICATED EDIT PAGE)
router.get('/:id', async (req, res) => {
  try {
    const verticalSettings = getSellerVerticalSettings(req.user.id);
    const product = await db.orm.public.Product
      .where({ id: req.params.id, userId: req.user.id })
      .first();

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found or access denied.' });
    }

    const formatted = normalizeProductWithVariants(product, verticalSettings.vertical);

    res.json({
      status: 'success',
      verticalSettings,
      product: formatted,
    });
  } catch (error) {
    console.error('Fetch Single Product Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch product details.' });
  }
});

// 2. CREATE A NEW PRODUCT WITH UP TO 6 UPLOADED PHOTOS & DYNAMIC VARIANTS
router.post('/', upload.array('images', 6), async (req, res) => {
  try {
    const { name, description, price, stock, colors, variants, brand, category, vertical } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ status: 'error', message: 'Product name is required.' });
    }

    // Parse variants if passed
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      } catch (e) {
        parsedVariants = [];
      }
    }

    // Parse colors array if passed
    let parsedColors = [];
    if (colors) {
      try {
        parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
      } catch (e) {
        parsedColors = [];
      }
    }

    let numericPrice = parseFloat(price);
    let numericStock = parseInt(stock, 10);

    // If variants are supplied, compute prices & stock from variants
    if (parsedVariants && parsedVariants.length > 0) {
      const validPrices = parsedVariants.map(v => parseFloat(v.price)).filter(p => !isNaN(p) && p > 0);
      numericPrice = validPrices.length > 0 ? Math.min(...validPrices) : (parseFloat(price) || 0);
      numericStock = parsedVariants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
    } else {
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({ status: 'error', message: 'Please enter a valid positive price.' });
      }
      if (isNaN(numericStock) || numericStock < 0) {
        return res.status(400).json({ status: 'error', message: 'Stock quantity cannot be negative.' });
      }
    }

    // Upload each file buffer to Cloudinary and collect the returned CDN URLs
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer, file.mimetype))
      );
    }

    const sellerVerticalSettings = getSellerVerticalSettings(req.user.id);
    const activeVertical = vertical || sellerVerticalSettings.vertical || 'electronics';

    // Package variants into storage
    const storagePayload = packageVariantsForStorage({
      variants: parsedVariants,
      brand: brand ? brand.trim() : '',
      category: category ? category.trim() : '',
      vertical: activeVertical,
      legacyColors: parsedColors,
    });

    // Create Product linked strictly to req.user.id
    const newProduct = await db.orm.public.Product.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      price: numericPrice,
      stock: numericStock,
      images: JSON.stringify(uploadedImages),
      colors: storagePayload,
      userId: req.user.id,
    });

    const normalized = normalizeProductWithVariants(newProduct, activeVertical);

    res.status(201).json({
      status: 'success',
      message: 'Product created successfully with multi-vertical variants!',
      product: normalized,
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to create product.' });
  }
});

// 3. UPDATE PRODUCT DETAILS, PHOTOS & DYNAMIC VARIANTS
router.put('/:id', upload.array('images', 6), async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, price, stock, existingImages, colors, variants, brand, category, vertical } = req.body;

    // Verify ownership
    const existingProduct = await db.orm.public.Product
      .where({ id: productId, userId: req.user.id })
      .first();

    if (!existingProduct) {
      return res.status(404).json({ status: 'error', message: 'Product not found or access denied.' });
    }

    // Parse variants if provided
    let parsedVariants = null;
    if (variants !== undefined) {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      } catch (e) {
        parsedVariants = null;
      }
    }

    // Parse colors
    let finalColors = [];
    if (colors !== undefined) {
      try {
        finalColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
      } catch (e) {
        finalColors = [];
      }
    }

    let numericPrice = price !== undefined ? parseFloat(price) : existingProduct.price;
    let numericStock = stock !== undefined ? parseInt(stock, 10) : existingProduct.stock;

    if (parsedVariants && parsedVariants.length > 0) {
      const validPrices = parsedVariants.map(v => parseFloat(v.price)).filter(p => !isNaN(p) && p > 0);
      numericPrice = validPrices.length > 0 ? Math.min(...validPrices) : numericPrice;
      numericStock = parsedVariants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
    }

    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ status: 'error', message: 'Please enter a valid positive price.' });
    }

    // Determine which existing images the client wants to keep
    let keptImages = [];
    if (existingImages) {
      try {
        keptImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
      } catch (e) {
        keptImages = [];
      }
    } else {
      try {
        keptImages = existingProduct.images ? JSON.parse(existingProduct.images) : [];
      } catch (e) {
        keptImages = [];
      }
    }

    // Delete Cloudinary assets for images that were removed by the user
    try {
      const previousImages = existingProduct.images ? JSON.parse(existingProduct.images) : [];
      const removedImages = previousImages.filter((url) => !keptImages.includes(url));
      if (removedImages.length > 0) {
        await deleteFromCloudinary(removedImages);
      }
    } catch (e) {
      console.warn('Could not clean up removed images from Cloudinary:', e.message);
    }

    // Upload any newly added files to Cloudinary
    let newUploaded = [];
    if (req.files && req.files.length > 0) {
      newUploaded = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer, file.mimetype))
      );
    }

    const combinedImages = [...keptImages, ...newUploaded].slice(0, 6);

    const sellerVerticalSettings = getSellerVerticalSettings(req.user.id);
    const activeVertical = vertical || sellerVerticalSettings.vertical || 'electronics';

    // Package variants
    let storageColorsPayload;
    if (parsedVariants !== null) {
      storageColorsPayload = packageVariantsForStorage({
        variants: parsedVariants,
        brand: brand !== undefined ? brand : '',
        category: category !== undefined ? category : '',
        vertical: activeVertical,
        legacyColors: finalColors,
      });
    } else {
      storageColorsPayload = existingProduct.colors;
    }

    // Perform Update
    const updatedProduct = await db.orm.public.Product
      .where({ id: productId })
      .update({
        name: name ? name.trim() : existingProduct.name,
        description: description !== undefined ? description.trim() : existingProduct.description,
        price: numericPrice,
        stock: numericStock,
        images: JSON.stringify(combinedImages),
        colors: storageColorsPayload,
      });

    const normalized = normalizeProductWithVariants(updatedProduct, activeVertical);

    res.json({
      status: 'success',
      message: 'Product updated successfully!',
      product: normalized,
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update product.' });
  }
});

// 4. DELETE PRODUCT (also cleans up Cloudinary assets)
router.delete('/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    // Verify ownership
    const existingProduct = await db.orm.public.Product
      .where({ id: productId, userId: req.user.id })
      .first();

    if (!existingProduct) {
      return res.status(404).json({ status: 'error', message: 'Product not found or access denied.' });
    }

    // Delete images from Cloudinary before removing the DB record
    try {
      const images = existingProduct.images ? JSON.parse(existingProduct.images) : [];
      if (images.length > 0) {
        await deleteFromCloudinary(images);
      }
    } catch (e) {
      console.warn('Could not clean up Cloudinary images for deleted product:', e.message);
    }

    await db.orm.public.Product.where({ id: productId }).delete();

    res.json({
      status: 'success',
      message: 'Product deleted successfully!',
    });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete product.' });
  }
});

export default router;
