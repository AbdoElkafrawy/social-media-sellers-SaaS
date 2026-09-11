import express from 'express';
import { db } from '../db.js';
import { normalizeProductWithVariants, getSellerVerticalSettings } from '../services/verticalService.js';

const router = express.Router();

// GET PUBLIC STORE FRONT & PRODUCTS (No Authentication Required for Buyers)
router.get('/:id', async (req, res) => {
  try {
    const storeId = req.params.id;

    // Find Seller by ID
    const seller = await db.orm.public.User.where({ id: storeId }).first();

    if (!seller) {
      return res.status(404).json({
        status: 'error',
        message: 'Store not found. Please verify the storefront link.',
      });
    }

    const verticalSettings = getSellerVerticalSettings(seller.id);

    // Fetch Seller's Products
    const products = await db.orm.public.Product.where({ userId: seller.id }).all();

    const formattedProducts = products.map((p) => normalizeProductWithVariants(p, verticalSettings.vertical));

    res.json({
      status: 'success',
      store: {
        id: seller.id,
        storeName: seller.storeName,
        currency: seller.currency || 'EGP',
        email: seller.email,
        whatsappNumber: seller.whatsappNumber || '',
        verticalSettings,
      },
      products: formattedProducts || [],
    });
  } catch (error) {
    console.error('Fetch Public Store Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load storefront.' });
  }
});

export default router;
