/**
 * Download Google Pixel product images from GSMArena and re-seed the store.
 * Saves images to server/public/uploads/pixel/ and updates DB with local paths.
 *
 * Run with:  node src/download-pixel-images.js
 */

import 'dotenv/config';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../public/uploads/pixel');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Download helper with redirect support ────────────────────────────────────
function downloadFile(url, destPath, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects: ' + url));

    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://www.gsmarena.com/',
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, destPath, redirectCount + 1)
          .then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(destPath)));
      file.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timeout: ' + url)); });
  });
}

// ── Try downloading from a list of candidate URLs ───────────────────────────
async function tryDownload(candidates, destPath) {
  for (const url of candidates) {
    try {
      await downloadFile(url, destPath);
      const stat = fs.statSync(destPath);
      if (stat.size > 5000) { // must be at least 5 KB to be a real image
        return true;
      }
      fs.unlinkSync(destPath); // delete tiny/empty file
    } catch {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    }
  }
  return false;
}

// ── Product image candidate URLs ─────────────────────────────────────────────
// For each product: [ [front candidates], [back candidates], [angle candidates] ]
const PRODUCTS = [
  {
    name: 'Google Pixel 9 Pro XL',
    slug: 'pixel9-pro-xl',
    description: 'The ultimate Google AI phone. 6.8" Super Actua LTPO display, 50MP triple camera system with 5× optical zoom, Tensor G4 chip, 5100 mAh battery. Available in Obsidian, Porcelain, Hazel, and Rose Quartz.',
    price: 1099.00, stock: 25,
    imageSets: [
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel9-pro-xl.jpg',
       'https://cdn.mos.cms.futurecdn.net/google-pixel-9-pro-xl-obsidian.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel9-pro-xl-2.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel9-pro-xl-3.jpg'],
    ],
  },
  {
    name: 'Google Pixel 9 Pro',
    slug: 'pixel9-pro',
    description: 'Pro-grade AI photography in a compact body. 6.3" Super Actua display, 50MP main + 48MP ultrawide + 48MP 5× telephoto cameras. Tensor G4 with 16 GB RAM and a 7-year OS guarantee.',
    price: 999.00, stock: 30,
    imageSets: [
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel9-pro.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel9-pro-2.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel9-pro-3.jpg'],
    ],
  },
  {
    name: 'Google Pixel 9',
    slug: 'pixel9',
    description: "Google's best everyday AI phone. 6.3\" Actua display, 50MP main + 10.5MP ultrawide, Tensor G4, 4700 mAh battery, IP68 water resistance. 7 years of OS and security updates.",
    price: 799.00, stock: 50,
    imageSets: [
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel9.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel9-2.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel9-3.jpg'],
    ],
  },
  {
    name: 'Google Pixel 9 Pro Fold',
    slug: 'pixel9-pro-fold',
    description: "Google's flagship foldable. 8\" inner + 6.3\" outer Super Actua displays, triple rear cameras, Tensor G4, all-day battery. The thinnest foldable Google has ever made.",
    price: 1799.00, stock: 15,
    imageSets: [
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel9-pro-fold.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel9-pro-fold-2.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel9-pro-fold-3.jpg'],
    ],
  },
  {
    name: 'Google Pixel 8 Pro',
    slug: 'pixel8-pro',
    description: 'Award-winning AI photography. 6.7" LTPO Super Actua 120Hz display, 50MP + 48MP + 48MP 5× telephoto cameras, Tensor G3, 5050 mAh with 30W fast charging. Built-in temperature sensor.',
    price: 799.00, stock: 40,
    imageSets: [
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel8-pro.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel8-pro-2.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel8-pro-3.jpg'],
    ],
  },
  {
    name: 'Google Pixel 8',
    slug: 'pixel8',
    description: 'Smart AI features in a premium 6.2" Actua design. 50MP main + 12MP ultrawide, Tensor G3, 4575 mAh battery, IP68. Magic Eraser, Best Take, and Audio Magic Eraser included.',
    price: 599.00, stock: 45,
    imageSets: [
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel8.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel8-2.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel8-3.jpg'],
    ],
  },
  {
    name: 'Google Pixel 8a',
    slug: 'pixel8a',
    description: 'All Google AI essentials at a smarter price. 6.1" Actua display, 64MP main + 13MP ultrawide, Tensor G3, 4492 mAh with wireless charging. IP67 rated. Best value Pixel ever.',
    price: 499.00, stock: 60,
    imageSets: [
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel8a.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel8a-2.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel8a-3.jpg'],
    ],
  },
  {
    name: 'Google Pixel 7 Pro',
    slug: 'pixel7-pro',
    description: 'The pinnacle of Pixel 7 series. 6.7" LTPO OLED 120Hz, 50MP + 12MP ultrawide + 48MP 5× telephoto, Tensor G2. Cinematic Blur, Photo Unblur, real-time translation.',
    price: 649.00, stock: 20,
    imageSets: [
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel7-pro.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel7-pro-2.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel7-pro-3.jpg'],
    ],
  },
  {
    name: 'Google Pixel 7a',
    slug: 'pixel7a',
    description: 'Performance and value redefined. 6.1" OLED 90Hz, 64MP + 13MP ultrawide, Tensor G2, 4385 mAh battery. Wireless charging, IP67, 5G-ready at an affordable price.',
    price: 399.00, stock: 55,
    imageSets: [
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel7a.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel7a-2.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel7a-3.jpg'],
    ],
  },
  {
    name: 'Google Pixel 6a',
    slug: 'pixel6a',
    description: 'The essential Pixel experience. 6.1" OLED, 12.2MP + 12MP ultrawide, Tensor G1, 4410 mAh battery. Titan M2 security chip, IP67, 5G connectivity at a budget price.',
    price: 299.00, stock: 35,
    imageSets: [
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel6a.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel6a-2.jpg'],
      ['https://fdn.gsmarena.com/vv/bigpic/google-pixel6a-3.jpg'],
    ],
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n📥 Downloading Google Pixel product images...\n');

  const STORE_EMAIL = 'googlepixel@seller.com';
  const seller = await db.orm.public.User.where({ email: STORE_EMAIL }).first();
  if (!seller) {
    console.error('❌ Seller account not found. Run seed-pixel-store.js first.');
    process.exit(1);
  }

  // Remove existing products
  const existing = await db.orm.public.Product.where({ userId: seller.id }).all();
  for (const p of existing) {
    await db.orm.public.Product.where({ id: p.id }).delete();
  }
  console.log(`🧹 Cleared ${existing.length} old products.\n`);

  for (const product of PRODUCTS) {
    const localPaths = [];

    for (let i = 0; i < product.imageSets.length; i++) {
      const filename = `${product.slug}-${i + 1}.jpg`;
      const destPath = path.join(UPLOAD_DIR, filename);
      const localUrl = `/uploads/pixel/${filename}`;

      // Skip if already downloaded
      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 5000) {
        localPaths.push(localUrl);
        process.stdout.write(`  ✓ (cached) ${filename}\n`);
        continue;
      }

      const ok = await tryDownload(product.imageSets[i], destPath);
      if (ok) {
        localPaths.push(localUrl);
        process.stdout.write(`  ✅ ${filename}\n`);
      } else {
        process.stdout.write(`  ⚠️  ${filename} — download failed, no image\n`);
      }
    }

    await db.orm.public.Product.create({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      images: JSON.stringify(localPaths),
      userId: seller.id,
    });

    console.log(`  📦 "${product.name}" seeded with ${localPaths.length} local image(s).\n`);
  }

  console.log('🎉 All done! Products seeded with local images.\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
