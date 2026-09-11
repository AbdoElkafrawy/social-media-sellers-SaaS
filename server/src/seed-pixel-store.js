/**
 * Google Pixel Store Seed Script
 * Creates a seller account for "Google Pixel" store and seeds 10 Google Pixel products.
 *
 * Run with:  node src/seed-pixel-store.js
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

// ── Store Credentials ────────────────────────────────────────────────────────
const STORE_EMAIL    = 'googlepixel@seller.com';
const STORE_PASSWORD = 'Pixel@2024';
const STORE_NAME     = 'Google Pixel';
const STORE_CURRENCY = 'USD';
const STORE_WHATSAPP = '+201145292389';

// ── Pixel product image URLs hosted on Cloudinary CDN ────────────────────────
// These are reliable public images served via Cloudinary — no local filesystem dependency.
const PIXEL_PRODUCTS = [
  {
    name: 'Google Pixel 9 Pro XL',
    description: 'The ultimate Google AI phone. 6.8" Super Actua LTPO display, 50MP triple camera system with 5× optical zoom, Tensor G4 chip, 5100 mAh battery. Available in Obsidian, Porcelain, Hazel, and Rose Quartz.',
    price: 1099.00,
    stock: 25,
    images: JSON.stringify([
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-9-pro-xl-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-9-pro-xl-2.jpg',
    ]),
    colors: JSON.stringify([
      { name: 'Obsidian', hex: '#1c1c1e' },
      { name: 'Porcelain', hex: '#f5f0eb' },
      { name: 'Hazel', hex: '#7a705e' },
      { name: 'Rose Quartz', hex: '#e8c4c4' },
    ]),
  },
  {
    name: 'Google Pixel 9 Pro',
    description: 'Pro-grade AI photography in a compact body. 6.3" Super Actua display, 50MP main + 48MP ultrawide + 48MP 5× telephoto cameras. Powered by Tensor G4 with 16 GB RAM and a 7-year OS guarantee.',
    price: 999.00,
    stock: 30,
    images: JSON.stringify([
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-9-pro-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-9-pro-2.jpg',
    ]),
    colors: JSON.stringify([
      { name: 'Obsidian', hex: '#1c1c1e' },
      { name: 'Porcelain', hex: '#f5f0eb' },
      { name: 'Hazel', hex: '#7a705e' },
      { name: 'Rose Quartz', hex: '#e8c4c4' },
    ]),
  },
  {
    name: 'Google Pixel 9',
    description: "Google's best everyday AI phone. 6.3\" Actua display, 50MP main + 10.5MP ultrawide cameras, Tensor G4, 4700 mAh battery, IP68 water resistance. 7 years of OS and security updates included.",
    price: 799.00,
    stock: 50,
    images: JSON.stringify([
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-9-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-9-2.jpg',
    ]),
    colors: JSON.stringify([
      { name: 'Obsidian', hex: '#1c1c1e' },
      { name: 'Porcelain', hex: '#f5f0eb' },
      { name: 'Wintergreen', hex: '#a3d9c9' },
      { name: 'Peony', hex: '#e8c4c4' },
    ]),
  },
  {
    name: 'Google Pixel 9 Pro Fold',
    description: "Google's flagship foldable with full AI features. 8\" inner + 6.3\" outer Super Actua displays, triple rear cameras, Tensor G4 chip, all-day battery. The thinnest foldable Google has ever made.",
    price: 1799.00,
    stock: 15,
    images: JSON.stringify([
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-9-pro-fold-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-9-pro-fold-2.jpg',
    ]),
    colors: JSON.stringify([
      { name: 'Obsidian', hex: '#1c1c1e' },
      { name: 'Porcelain', hex: '#f5f0eb' },
    ]),
  },
  {
    name: 'Google Pixel 8 Pro',
    description: 'Award-winning AI photography. 6.7" LTPO Super Actua 120Hz display, 50MP main + 48MP ultrawide + 48MP 5× telephoto, Tensor G3, 5050 mAh battery with 30W fast charging. Built-in temperature sensor.',
    price: 799.00,
    stock: 40,
    images: JSON.stringify([
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8-pro-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8-pro-2.jpg',
    ]),
    colors: JSON.stringify([
      { name: 'Obsidian', hex: '#1c1c1e' },
      { name: 'Porcelain', hex: '#f5f0eb' },
      { name: 'Bay Blue', hex: '#4a7b9d' },
      { name: 'Mint Green', hex: '#a3d9c9' },
    ]),
  },
  {
    name: 'Google Pixel 8',
    description: 'Smart AI features in a premium 6.2" Actua design. 50MP main + 12MP ultrawide cameras, Tensor G3, 4575 mAh battery, IP68. Includes Magic Eraser, Best Take, and Audio Magic Eraser.',
    price: 599.00,
    stock: 45,
    images: JSON.stringify([
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8-2.jpg',
    ]),
    colors: JSON.stringify([
      { name: 'Obsidian', hex: '#1c1c1e' },
      { name: 'Hazel', hex: '#7a705e' },
      { name: 'Rose Quartz', hex: '#e8c4c4' },
      { name: 'Mint Green', hex: '#a3d9c9' },
    ]),
  },
  {
    name: 'Google Pixel 8a',
    description: 'All Google AI essentials at a smarter price. 6.1" Actua display, 64MP main + 13MP ultrawide cameras, Tensor G3, 4492 mAh with wireless charging. IP67 rated. Best value Pixel ever.',
    price: 499.00,
    stock: 60,
    images: JSON.stringify([
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8a-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-8a-2.jpg',
    ]),
    colors: JSON.stringify([
      { name: 'Obsidian', hex: '#1c1c1e' },
      { name: 'Porcelain', hex: '#f5f0eb' },
      { name: 'Bay Blue', hex: '#4a7b9d' },
      { name: 'Aloe', hex: '#a3d9c9' },
    ]),
  },
  {
    name: 'Google Pixel 7 Pro',
    description: 'The pinnacle of Pixel 7 series. 6.7" LTPO OLED 120Hz display, 50MP main + 12MP ultrawide + 48MP 5× telephoto, Tensor G2. Cinematic Blur, Photo Unblur, and real-time translation built in.',
    price: 649.00,
    stock: 20,
    images: JSON.stringify([
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-7-pro-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-7-pro-2.jpg',
    ]),
    colors: JSON.stringify([
      { name: 'Obsidian', hex: '#1c1c1e' },
      { name: 'Snow', hex: '#ffffff' },
      { name: 'Hazel', hex: '#7a705e' },
    ]),
  },
  {
    name: 'Google Pixel 7a',
    description: 'Performance and value redefined. 6.1" OLED 90Hz display, 64MP main + 13MP ultrawide cameras, Tensor G2, 4385 mAh battery. Wireless charging, IP67 protection, 5G-ready at an affordable price.',
    price: 399.00,
    stock: 55,
    images: JSON.stringify([
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-7a-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-7a-2.jpg',
    ]),
    colors: JSON.stringify([
      { name: 'Charcoal', hex: '#1c1c1e' },
      { name: 'Snow', hex: '#ffffff' },
      { name: 'Sea Blue', hex: '#4a7b9d' },
      { name: 'Coral', hex: '#e8784a' },
    ]),
  },
  {
    name: 'Google Pixel 6a',
    description: 'The essential Pixel experience. 6.1" OLED display, 12.2MP main + 12MP ultrawide cameras, Tensor G1, 4410 mAh battery. Titan M2 security chip, IP67 rating, 5G connectivity at a budget-friendly price.',
    price: 299.00,
    stock: 35,
    images: JSON.stringify([
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-6a-1.jpg',
      'https://fdn2.gsmarena.com/vv/pics/google/google-pixel-6a-2.jpg',
    ]),
    colors: JSON.stringify([
      { name: 'Charcoal', hex: '#1c1c1e' },
      { name: 'Chalk', hex: '#ffffff' },
      { name: 'Sage', hex: '#7c9a7e' },
    ]),
  },
];

// ── Main Seed Function ────────────────────────────────────────────────────────
export async function seedPixelStore(autoExit = false) {
  console.log('\n🚀 Google Pixel Store Seeder Starting...\n');

  try {
    // 1. Check if account already exists
    let seller = await db.orm.public.User.where({ email: STORE_EMAIL }).first();

    if (seller) {
      console.log(`ℹ️  Account already exists for ${STORE_EMAIL}.`);
    } else {
      // 2. Create the seller account
      console.log(`📝 Creating seller account: ${STORE_EMAIL} ...`);
      const hashedPassword = await bcrypt.hash(STORE_PASSWORD, 10);
      seller = await db.orm.public.User.create({
        email: STORE_EMAIL,
        password: hashedPassword,
        storeName: STORE_NAME,
        currency: STORE_CURRENCY,
      });
      console.log(`✅ Seller account created! ID: ${seller.id}`);
    }

    // 3. Clear existing products for this seller (clean re-seed)
    const existing = await db.orm.public.Product.where({ userId: seller.id }).all();
    if (existing.length > 0) {
      console.log(`🧹 Removing ${existing.length} existing products...`);
      for (const p of existing) {
        await db.orm.public.Product.where({ id: p.id }).delete();
      }
    }

    // 4. Seed all 10 Pixel products
    console.log('\n📦 Seeding 10 Google Pixel products...\n');
    for (const product of PIXEL_PRODUCTS) {
      const created = await db.orm.public.Product.create({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        images: product.images,
        userId: seller.id,
      });
      console.log(`  ✓ ${created.name} — $${product.price} (${product.stock} in stock)`);
    }

    console.log(`\n🎉 Done! Google Pixel store seeded successfully.`);
    console.log(`\n📋 Seller Login Credentials:`);
    console.log(`   Email    : ${STORE_EMAIL}`);
    console.log(`   Password : ${STORE_PASSWORD}`);
    console.log(`   Store    : ${STORE_NAME}`);
    console.log(`   Currency : ${STORE_CURRENCY}`);
    console.log(`   Store ID : ${seller.id}`);
    console.log(`\n   🌐 Public Store URL: http://localhost:5173/store/${seller.id}\n`);

    if (autoExit) {
      process.exit(0);
    }
    return { success: true, seller };
  } catch (err) {
    console.error('\n❌ Seed Error:', err.message || err);
    if (autoExit) {
      process.exit(1);
    }
    return { success: false, error: err.message };
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed-pixel-store.js')) {
  seedPixelStore(true);
}

