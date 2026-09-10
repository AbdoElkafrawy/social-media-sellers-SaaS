/**
 * Generates branded Google Pixel product placeholder SVG images
 * and re-seeds the store with local image paths.
 *
 * Run with:  node src/generate-pixel-images.js
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../public/uploads/pixel');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Color palettes for each phone variant ────────────────────────────────────
const VARIANTS = [
  { body: '#1a1a2e', screen: '#16213e', accent: '#4A90D9', label: 'Obsidian' },
  { body: '#2d2d2d', screen: '#1a1a1a', accent: '#17A07E', label: 'Charcoal' },
  { body: '#f0ece4', screen: '#e8e4dc', accent: '#0E523E', label: 'Porcelain' },
  { body: '#8B4A6B', screen: '#6d3854', accent: '#F59325', label: 'Rose' },
  { body: '#2F4858', screen: '#1a2d3a', accent: '#17A07E', label: 'Hazel' },
];

// ── Phone models with their color + spec details ──────────────────────────────
const PRODUCTS = [
  {
    slug: 'pixel9-pro-xl',
    name: 'Pixel 9 Pro XL',
    specs: ['6.8" Super Actua', '50MP Triple Camera', 'Tensor G4', '5100 mAh'],
    variant: VARIANTS[0],
    badge: 'PRO XL',
    badgeColor: '#4A90D9',
  },
  {
    slug: 'pixel9-pro',
    name: 'Pixel 9 Pro',
    specs: ['6.3" Super Actua', '50+48+48MP', 'Tensor G4', '16 GB RAM'],
    variant: VARIANTS[1],
    badge: 'PRO',
    badgeColor: '#17A07E',
  },
  {
    slug: 'pixel9',
    name: 'Pixel 9',
    specs: ['6.3" Actua', '50MP + 10.5MP', 'Tensor G4', '4700 mAh'],
    variant: VARIANTS[2],
    badge: 'NEW',
    badgeColor: '#0E523E',
  },
  {
    slug: 'pixel9-pro-fold',
    name: 'Pixel 9 Pro Fold',
    specs: ['8" Inner Display', 'Foldable Design', 'Tensor G4', 'Thinnest Fold'],
    variant: VARIANTS[3],
    badge: 'FOLD',
    badgeColor: '#F59325',
    isFold: true,
  },
  {
    slug: 'pixel8-pro',
    name: 'Pixel 8 Pro',
    specs: ['6.7" LTPO 120Hz', '50+48+48MP', 'Tensor G3', '5050 mAh'],
    variant: VARIANTS[4],
    badge: 'PRO',
    badgeColor: '#17A07E',
  },
  {
    slug: 'pixel8',
    name: 'Pixel 8',
    specs: ['6.2" Actua', '50MP + 12MP', 'Tensor G3', '4575 mAh'],
    variant: VARIANTS[0],
    badge: '',
    badgeColor: '#4A90D9',
  },
  {
    slug: 'pixel8a',
    name: 'Pixel 8a',
    specs: ['6.1" Actua', '64MP + 13MP', 'Tensor G3', 'Wireless Charging'],
    variant: VARIANTS[2],
    badge: 'VALUE',
    badgeColor: '#0E523E',
  },
  {
    slug: 'pixel7-pro',
    name: 'Pixel 7 Pro',
    specs: ['6.7" LTPO 120Hz', '50+12+48MP', 'Tensor G2', '5000 mAh'],
    variant: VARIANTS[1],
    badge: 'PRO',
    badgeColor: '#17A07E',
  },
  {
    slug: 'pixel7a',
    name: 'Pixel 7a',
    specs: ['6.1" OLED 90Hz', '64MP + 13MP', 'Tensor G2', '4385 mAh'],
    variant: VARIANTS[3],
    badge: '',
    badgeColor: '#F59325',
  },
  {
    slug: 'pixel6a',
    name: 'Pixel 6a',
    specs: ['6.1" OLED', '12.2MP + 12MP', 'Tensor G1', '4410 mAh'],
    variant: VARIANTS[4],
    badge: 'BUDGET',
    badgeColor: '#2F4858',
  },
];

// ── SVG phone frame generator ─────────────────────────────────────────────────
function generatePhoneSVG(product, angle = 'front') {
  const v = product.variant;
  const isFold = product.isFold && angle === 'back';

  // Phone dimensions
  const W = 400, H = 560;
  const phoneW = isFold ? 200 : 160;
  const phoneH = isFold ? 220 : 320;
  const phoneX = (W - phoneW) / 2;
  const phoneY = (H - phoneH) / 2;
  const radius = isFold ? 16 : 20;

  // Screen area
  const screenPad = 8;
  const screenX = phoneX + screenPad;
  const screenY = phoneY + (isFold ? 20 : 30);
  const screenW = phoneW - screenPad * 2;
  const screenH = phoneH - (isFold ? 40 : 60);
  const screenR = radius - 4;

  // Camera area
  const camX = phoneX + phoneW / 2;
  const camY = isFold ? phoneY + phoneH - 15 : phoneY + 12;

  // Spec lines to show on screen
  const specY0 = screenY + screenH * 0.38;
  const specLines = product.specs;

  const shadowId = `sh-${product.slug}-${angle}`;
  const gradId = `gr-${product.slug}-${angle}`;
  const screenGradId = `sg-${product.slug}-${angle}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <filter id="${shadowId}">
      <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="rgba(0,0,0,0.35)"/>
    </filter>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${v.body}"/>
      <stop offset="100%" stop-color="${lighten(v.body, 30)}"/>
    </linearGradient>
    <linearGradient id="${screenGradId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${v.screen}"/>
      <stop offset="100%" stop-color="${v.body}"/>
    </linearGradient>
    <clipPath id="clip-${product.slug}-${angle}">
      <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}" rx="${screenR}"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="#F3F0EC"/>

  <!-- Soft radial glow behind phone -->
  <ellipse cx="${W/2}" cy="${H/2}" rx="180" ry="200" fill="${v.accent}22"/>

  <!-- Phone body -->
  <rect x="${phoneX}" y="${phoneY}" width="${phoneW}" height="${phoneH}"
        rx="${radius}" fill="url(#${gradId})" filter="url(#${shadowId})"/>

  <!-- Highlight shine on left edge -->
  <rect x="${phoneX}" y="${phoneY + radius}" width="3" height="${phoneH - radius * 2}"
        rx="2" fill="rgba(255,255,255,0.18)"/>

  <!-- Screen -->
  <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}"
        rx="${screenR}" fill="url(#${screenGradId})"/>

  ${angle === 'front' ? `
  <!-- Notch/punch-hole -->
  <circle cx="${W/2}" cy="${screenY + 10}" r="5" fill="${v.body}"/>

  <!-- Status bar dots -->
  <circle cx="${screenX + 14}" cy="${screenY + 10}" r="2.5" fill="rgba(255,255,255,0.5)"/>
  <circle cx="${screenX + 22}" cy="${screenY + 10}" r="2.5" fill="rgba(255,255,255,0.5)"/>

  <!-- G logo on screen -->
  <text x="${W/2}" y="${specY0 - 20}" text-anchor="middle"
        font-family="Arial,sans-serif" font-size="28" font-weight="900"
        fill="${v.accent}" letter-spacing="-1">G</text>

  <!-- Product name on screen -->
  <text x="${W/2}" y="${specY0 + 8}" text-anchor="middle"
        font-family="Arial,sans-serif" font-size="10" font-weight="700"
        fill="rgba(255,255,255,0.9)" letter-spacing="1">${product.name.toUpperCase()}</text>

  <!-- Divider -->
  <line x1="${screenX + 20}" y1="${specY0 + 16}" x2="${screenX + screenW - 20}" y2="${specY0 + 16}"
        stroke="${v.accent}" stroke-width="0.8" opacity="0.6"/>

  <!-- Spec lines -->
  ${specLines.map((s, i) => `
  <text x="${W/2}" y="${specY0 + 32 + i * 16}" text-anchor="middle"
        font-family="Arial,sans-serif" font-size="8.5" fill="rgba(255,255,255,0.65)">${s}</text>`).join('')}

  <!-- Home bar -->
  <rect x="${W/2 - 25}" y="${screenY + screenH - 8}" width="50" height="3"
        rx="2" fill="rgba(255,255,255,0.4)"/>
  ` : `
  <!-- Back camera module (Google style - square island) -->
  <rect x="${camX - 30}" y="${camY - 30}" width="60" height="60"
        rx="14" fill="${lighten(v.body, 15)}"/>
  <circle cx="${camX - 10}" cy="${camY - 10}" r="14" fill="#111" stroke="${v.accent}" stroke-width="1.5"/>
  <circle cx="${camX - 10}" cy="${camY - 10}" r="9" fill="#1a1a2e"/>
  <circle cx="${camX - 10}" cy="${camY - 10}" r="5" fill="${v.accent}99"/>
  <circle cx="${camX + 15}" cy="${camY - 10}" r="10" fill="#111" stroke="${v.accent}" stroke-width="1"/>
  <circle cx="${camX - 10}" cy="${camY + 15}" r="10" fill="#111" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <!-- Flash -->
  <circle cx="${camX + 15}" cy="${camY + 15}" r="5" fill="#FFC85C"/>

  <!-- Back Google logo -->
  <text x="${W/2}" y="${H/2 + 60}" text-anchor="middle"
        font-family="Arial,sans-serif" font-size="11" font-weight="700"
        fill="rgba(255,255,255,0.2)" letter-spacing="3">GOOGLE</text>
  `}

  <!-- Camera bump (side) for front view -->
  ${angle === 'front' && !isFold ? `
  <rect x="${phoneX + phoneW - 4}" y="${phoneY + 60}" width="6" height="60"
        rx="3" fill="${lighten(v.body, 20)}" opacity="0.7"/>` : ''}

  <!-- Volume buttons -->
  <rect x="${phoneX - 4}" y="${phoneY + 70}" width="5" height="22" rx="2" fill="${lighten(v.body, 25)}"/>
  <rect x="${phoneX - 4}" y="${phoneY + 98}" width="5" height="22" rx="2" fill="${lighten(v.body, 25)}"/>

  <!-- Power button -->
  <rect x="${phoneX + phoneW - 1}" y="${phoneY + 90}" width="5" height="30" rx="2" fill="${lighten(v.body, 25)}"/>

  ${product.badge ? `
  <!-- Badge -->
  <rect x="${phoneX}" y="${phoneY - 24}" width="${product.badge.length * 8 + 16}" height="20"
        rx="10" fill="${product.badgeColor}"/>
  <text x="${phoneX + (product.badge.length * 8 + 16)/2}" y="${phoneY - 10}" text-anchor="middle"
        font-family="Arial,sans-serif" font-size="9" font-weight="800"
        fill="white" letter-spacing="1">${product.badge}</text>
  ` : ''}
</svg>`;
}

// Simple color lightener (hex)
function lighten(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
  const b = Math.min(255, (num & 0x0000FF) + amount);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// ── Product database entries ──────────────────────────────────────────────────
const PRODUCT_DATA = [
  {
    slug: 'pixel9-pro-xl',
    name: 'Google Pixel 9 Pro XL',
    description: 'The ultimate Google AI phone. 6.8" Super Actua LTPO display, 50MP triple camera system with 5× optical zoom, Tensor G4 chip, 5100 mAh battery. Available in Obsidian, Porcelain, Hazel, and Rose Quartz.',
    price: 1099.00, stock: 25,
  },
  {
    slug: 'pixel9-pro',
    name: 'Google Pixel 9 Pro',
    description: 'Pro-grade AI photography in a compact body. 6.3" Super Actua display, 50MP main + 48MP ultrawide + 48MP 5× telephoto cameras. Tensor G4 with 16 GB RAM and a 7-year OS guarantee.',
    price: 999.00, stock: 30,
  },
  {
    slug: 'pixel9',
    name: 'Google Pixel 9',
    description: "Google's best everyday AI phone. 6.3\" Actua display, 50MP main + 10.5MP ultrawide, Tensor G4, 4700 mAh battery, IP68 water resistance. 7 years of OS and security updates.",
    price: 799.00, stock: 50,
  },
  {
    slug: 'pixel9-pro-fold',
    name: 'Google Pixel 9 Pro Fold',
    description: "Google's flagship foldable. 8\" inner + 6.3\" outer Super Actua displays, triple rear cameras, Tensor G4, all-day battery. The thinnest foldable Google has ever made.",
    price: 1799.00, stock: 15,
  },
  {
    slug: 'pixel8-pro',
    name: 'Google Pixel 8 Pro',
    description: 'Award-winning AI photography. 6.7" LTPO Super Actua 120Hz display, 50MP + 48MP + 48MP 5× telephoto, Tensor G3, 5050 mAh with 30W fast charging. Built-in temperature sensor.',
    price: 799.00, stock: 40,
  },
  {
    slug: 'pixel8',
    name: 'Google Pixel 8',
    description: 'Smart AI features in a premium 6.2" Actua design. 50MP main + 12MP ultrawide, Tensor G3, 4575 mAh battery, IP68. Magic Eraser, Best Take, and Audio Magic Eraser included.',
    price: 599.00, stock: 45,
  },
  {
    slug: 'pixel8a',
    name: 'Google Pixel 8a',
    description: 'All Google AI essentials at a smarter price. 6.1" Actua display, 64MP main + 13MP ultrawide, Tensor G3, 4492 mAh with wireless charging. IP67 rated. Best value Pixel ever.',
    price: 499.00, stock: 60,
  },
  {
    slug: 'pixel7-pro',
    name: 'Google Pixel 7 Pro',
    description: 'The pinnacle of Pixel 7 series. 6.7" LTPO OLED 120Hz, 50MP + 12MP ultrawide + 48MP 5× telephoto, Tensor G2. Cinematic Blur, Photo Unblur, real-time translation.',
    price: 649.00, stock: 20,
  },
  {
    slug: 'pixel7a',
    name: 'Google Pixel 7a',
    description: 'Performance and value redefined. 6.1" OLED 90Hz, 64MP + 13MP ultrawide, Tensor G2, 4385 mAh battery. Wireless charging, IP67, 5G-ready at an affordable price.',
    price: 399.00, stock: 55,
  },
  {
    slug: 'pixel6a',
    name: 'Google Pixel 6a',
    description: 'The essential Pixel experience. 6.1" OLED, 12.2MP + 12MP ultrawide, Tensor G1, 4410 mAh battery. Titan M2 security chip, IP67, 5G connectivity at a budget price.',
    price: 299.00, stock: 35,
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🎨 Generating Google Pixel product images...\n');

  // Generate SVG images for each product (3 angles per phone)
  for (const product of PRODUCTS) {
    for (const angle of ['front', 'back', 'side']) {
      const filename = `${product.slug}-${angle}.svg`;
      const destPath = path.join(UPLOAD_DIR, filename);
      const svg = generatePhoneSVG(product, angle);
      fs.writeFileSync(destPath, svg, 'utf8');
      console.log(`  ✅ ${filename}`);
    }
  }

  console.log('\n📦 Re-seeding Google Pixel store with local image paths...\n');

  const STORE_EMAIL = 'googlepixel@seller.com';
  const seller = await db.orm.public.User.where({ email: STORE_EMAIL }).first();
  if (!seller) {
    console.error('❌ Seller not found. Run seed-pixel-store.js first.');
    process.exit(1);
  }

  // Clear old products
  const existing = await db.orm.public.Product.where({ userId: seller.id }).all();
  for (const p of existing) {
    await db.orm.public.Product.where({ id: p.id }).delete();
  }
  console.log(`🧹 Cleared ${existing.length} old products.\n`);

  // Seed with local SVG image paths
  for (const data of PRODUCT_DATA) {
    const images = [
      `/uploads/pixel/${data.slug}-front.svg`,
      `/uploads/pixel/${data.slug}-back.svg`,
      `/uploads/pixel/${data.slug}-side.svg`,
    ];

    await db.orm.public.Product.create({
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
      images: JSON.stringify(images),
      userId: seller.id,
    });

    console.log(`  ✓ ${data.name} — $${data.price}`);
  }

  console.log('\n🎉 Done! All 10 products seeded with 3 local SVG images each.');
  console.log('\n📋 Login: googlepixel@seller.com / Pixel@2024');
  console.log(`   Store ID: ${seller.id}\n`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
