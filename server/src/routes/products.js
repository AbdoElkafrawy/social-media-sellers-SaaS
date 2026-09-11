import express from 'express';
import multer from 'multer';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import cloudinary from '../cloudinary.js';

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
    const products = await db.orm.public.Product.where({ userId: req.user.id }).all();
    const formatted = products.map((p) => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      colors: p.colors ? JSON.parse(p.colors) : [],
    }));

    res.json({
      status: 'success',
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
    const product = await db.orm.public.Product
      .where({ id: req.params.id, userId: req.user.id })
      .first();

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found or access denied.' });
    }

    res.json({
      status: 'success',
      product: {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        colors: product.colors ? JSON.parse(product.colors) : [],
      },
    });
  } catch (error) {
    console.error('Fetch Single Product Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch product details.' });
  }
});

// 2. CREATE A NEW PRODUCT WITH UP TO 6 UPLOADED PHOTOS & COLORS
router.post('/', upload.array('images', 6), async (req, res) => {
  try {
    const { name, description, price, stock, colors } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ status: 'error', message: 'Product name is required.' });
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ status: 'error', message: 'Please enter a valid positive price.' });
    }

    const numericStock = parseInt(stock, 10);
    if (isNaN(numericStock) || numericStock < 0) {
      return res.status(400).json({ status: 'error', message: 'Stock quantity cannot be negative.' });
    }

    // Upload each file buffer to Cloudinary and collect the returned CDN URLs
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer, file.mimetype))
      );
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

    // Create Product linked strictly to req.user.id
    const newProduct = await db.orm.public.Product.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      price: numericPrice,
      stock: numericStock,
      images: JSON.stringify(uploadedImages),
      colors: JSON.stringify(parsedColors),
      userId: req.user.id,
    });

    res.status(201).json({
      status: 'success',
      message: 'Product created successfully!',
      product: {
        ...newProduct,
        images: uploadedImages,
        colors: parsedColors,
      },
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Failed to create product.' });
  }
});

// 3. UPDATE PRODUCT DETAILS, PHOTOS & COLORS
router.put('/:id', upload.array('images', 6), async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, price, stock, existingImages, colors } = req.body;

    // Verify ownership
    const existingProduct = await db.orm.public.Product
      .where({ id: productId, userId: req.user.id })
      .first();

    if (!existingProduct) {
      return res.status(404).json({ status: 'error', message: 'Product not found or access denied.' });
    }

    const numericPrice = price !== undefined ? parseFloat(price) : existingProduct.price;
    const numericStock = stock !== undefined ? parseInt(stock, 10) : existingProduct.stock;

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

    // Parse colors
    let finalColors = [];
    if (colors !== undefined) {
      try {
        finalColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
      } catch (e) {
        finalColors = [];
      }
    } else {
      try {
        finalColors = existingProduct.colors ? JSON.parse(existingProduct.colors) : [];
      } catch (e) {
        finalColors = [];
      }
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
        colors: JSON.stringify(finalColors),
      });

    res.json({
      status: 'success',
      message: 'Product updated successfully!',
      product: {
        ...updatedProduct,
        images: combinedImages,
        colors: finalColors,
      },
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
