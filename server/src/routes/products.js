import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `prod-${uniqueSuffix}${ext}`);
  },
});

// File Filter & Size Limit (Max 6 files, 25MB limit per photo)
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit per photo
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, GIF) up to 25MB are allowed.'));
    }
  },
});

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

    // Process uploaded file paths
    const uploadedImages = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

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

    // Parse kept images + new uploaded images
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

    const newUploaded = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];
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

// 4. DELETE PRODUCT
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
