import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { db } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../public/uploads/pixel');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    let html = '';
    const req = protocol.get(url, { headers: BROWSER_HEADERS }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchHTML(res.headers.location).then(resolve).catch(reject);
      }
      res.setEncoding('utf8');
      res.on('data', chunk => html += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function downloadBinary(url, dest, referer) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, {
      headers: {
        ...BROWSER_HEADERS,
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': referer || 'https://store.google.com/',
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadBinary(res.headers.location, dest, referer).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(dest)));
      file.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

const STORE_PAGES = [
  { slug: 'pixel9-pro-xl',   url: 'https://store.google.com/us/product/pixel_9_pro_xl' },
  { slug: 'pixel9-pro',      url: 'https://store.google.com/us/product/pixel_9_pro' },
  { slug: 'pixel9',          url: 'https://store.google.com/us/product/pixel_9' },
  { slug: 'pixel9-pro-fold', url: 'https://store.google.com/us/product/pixel_9_pro_fold' },
  { slug: 'pixel8-pro',      url: 'https://store.google.com/us/product/pixel_8_pro' },
  { slug: 'pixel8',          url: 'https://store.google.com/us/product/pixel_8' },
  { slug: 'pixel8a',         url: 'https://store.google.com/us/product/pixel_8a' },
  { slug: 'pixel7-pro',      url: 'https://store.google.com/us/product/pixel_7_pro' },
  { slug: 'pixel7a',         url: 'https://store.google.com/us/product/pixel_7a' },
  { slug: 'pixel6a',         url: 'https://store.google.com/us/product/pixel_6a' },
];

async function scrapeAndDownload() {
  console.log('\n🌐 Scraping Google Store for real Pixel product images...\n');

  const results = {};

  for (const page of STORE_PAGES) {
    console.log(`\n→ Fetching ${page.url}`);
    try {
      const { status, html } = await fetchHTML(page.url);
      console.log(`  Status: ${status}, HTML size: ${html.length} bytes`);

      // Extract all image URLs (lh3 and storage.googleapis patterns)
      const patterns = [
        /https:\/\/lh3\.googleusercontent\.com\/[^"'\s\\>)]+/g,
        /https:\/\/storage\.googleapis\.com\/[^"'\s\\>)]+\.(jpg|jpeg|png|webp)/gi,
      ];

      let found = [];
      for (const pat of patterns) {
        const matches = [...html.matchAll(pat)].map(m => m[0]);
        found = found.concat(matches);
      }

      // Also look for og:image tags and structured data
      const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
      if (ogMatch) found.push(ogMatch[1]);

      const unique = [...new Set(found)].filter(u =>
        !u.includes('favicon') && !u.includes('logo') && !u.includes('icon') &&
        u.length > 30
      );

      console.log(`  Found ${unique.length} image URL(s)`);
      if (unique.length > 0) {
        unique.slice(0, 5).forEach(u => console.log('   ', u.substring(0, 90)));
      }

      results[page.slug] = unique;
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
      results[page.slug] = [];
    }
  }

  // Try to download images
  console.log('\n\n📥 Downloading images...\n');
  const productImages = {};

  for (const page of STORE_PAGES) {
    const urls = results[page.slug] || [];
    const downloaded = [];

    for (let i = 0; i < Math.min(urls.length, 3); i++) {
      const url = urls[i];
      const ext = url.includes('.webp') ? 'webp' : url.includes('.png') ? 'png' : 'jpg';
      const filename = `${page.slug}-${i + 1}.${ext}`;
      const destPath = path.join(UPLOAD_DIR, filename);

      try {
        await downloadBinary(url, destPath, page.url);
        const size = fs.statSync(destPath).size;
        if (size > 5000) {
          downloaded.push(`/uploads/pixel/${filename}`);
          console.log(`  ✅ ${filename} (${Math.round(size/1024)}KB)`);
        } else {
          fs.unlinkSync(destPath);
          console.log(`  ⚠️  ${filename} too small (${size}B), skipped`);
        }
      } catch (err) {
        console.log(`  ❌ ${filename}: ${err.message}`);
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      }
    }

    productImages[page.slug] = downloaded;
    if (downloaded.length === 0) {
      console.log(`  ⚠️  No images downloaded for ${page.slug} — will use SVG placeholder`);
      // Fall back to existing SVGs
      ['front', 'back', 'side'].forEach(angle => {
        const svgPath = `/uploads/pixel/${page.slug}-${angle}.svg`;
        const fullPath = path.join(__dirname, `../public/uploads/pixel/${page.slug}-${angle}.svg`);
        if (fs.existsSync(fullPath)) productImages[page.slug].push(svgPath);
      });
    }
  }

  return productImages;
}

async function reseedWithImages(productImages) {
  const PRODUCT_DATA = [
    { slug: 'pixel9-pro-xl',   name: 'Google Pixel 9 Pro XL',   price: 1099, stock: 25, description: 'The ultimate Google AI phone. 6.8" Super Actua LTPO display, 50MP triple camera system with 5× optical zoom, Tensor G4 chip, 5100 mAh battery. Available in Obsidian, Porcelain, Hazel, and Rose Quartz.' },
    { slug: 'pixel9-pro',      name: 'Google Pixel 9 Pro',       price: 999,  stock: 30, description: 'Pro-grade AI photography in a compact body. 6.3" Super Actua display, 50MP main + 48MP ultrawide + 48MP 5× telephoto cameras. Tensor G4 with 16 GB RAM and 7-year OS guarantee.' },
    { slug: 'pixel9',          name: 'Google Pixel 9',           price: 799,  stock: 50, description: "Google's best everyday AI phone. 6.3\" Actua display, 50MP main + 10.5MP ultrawide, Tensor G4, 4700 mAh battery, IP68 water resistance. 7 years of OS and security updates." },
    { slug: 'pixel9-pro-fold', name: 'Google Pixel 9 Pro Fold',  price: 1799, stock: 15, description: "Google's flagship foldable. 8\" inner + 6.3\" outer Super Actua displays, triple rear cameras, Tensor G4, all-day battery. The thinnest foldable Google has ever made." },
    { slug: 'pixel8-pro',      name: 'Google Pixel 8 Pro',       price: 799,  stock: 40, description: 'Award-winning AI photography. 6.7" LTPO Super Actua 120Hz display, 50MP + 48MP + 48MP 5× telephoto, Tensor G3, 5050 mAh with 30W fast charging. Built-in temperature sensor.' },
    { slug: 'pixel8',          name: 'Google Pixel 8',           price: 599,  stock: 45, description: 'Smart AI features in a premium 6.2" Actua design. 50MP main + 12MP ultrawide, Tensor G3, 4575 mAh battery, IP68. Magic Eraser, Best Take, and Audio Magic Eraser included.' },
    { slug: 'pixel8a',         name: 'Google Pixel 8a',          price: 499,  stock: 60, description: 'All Google AI essentials at a smarter price. 6.1" Actua display, 64MP main + 13MP ultrawide, Tensor G3, 4492 mAh with wireless charging. IP67 rated. Best value Pixel ever.' },
    { slug: 'pixel7-pro',      name: 'Google Pixel 7 Pro',       price: 649,  stock: 20, description: 'The pinnacle of Pixel 7 series. 6.7" LTPO OLED 120Hz, 50MP + 12MP ultrawide + 48MP 5× telephoto, Tensor G2. Cinematic Blur, Photo Unblur, real-time translation.' },
    { slug: 'pixel7a',         name: 'Google Pixel 7a',          price: 399,  stock: 55, description: 'Performance and value redefined. 6.1" OLED 90Hz, 64MP + 13MP ultrawide, Tensor G2, 4385 mAh battery. Wireless charging, IP67, 5G-ready at an affordable price.' },
    { slug: 'pixel6a',         name: 'Google Pixel 6a',          price: 299,  stock: 35, description: 'The essential Pixel experience. 6.1" OLED, 12.2MP + 12MP ultrawide, Tensor G1, 4410 mAh battery. Titan M2 security chip, IP67, 5G connectivity at a budget price.' },
  ];

  const seller = await db.orm.public.User.where({ email: 'googlepixel@seller.com' }).first();
  if (!seller) { console.error('Seller not found'); process.exit(1); }

  const existing = await db.orm.public.Product.where({ userId: seller.id }).all();
  for (const p of existing) await db.orm.public.Product.where({ id: p.id }).delete();
  console.log(`\n🧹 Cleared ${existing.length} old products\n`);

  for (const data of PRODUCT_DATA) {
    const images = productImages[data.slug] || [];
    await db.orm.public.Product.create({
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
      images: JSON.stringify(images),
      userId: seller.id,
    });
    console.log(`  ✓ ${data.name} — ${images.length} image(s)`);
  }
  console.log('\n✅ Store re-seeded!\n');
}

async function main() {
  const productImages = await scrapeAndDownload();
  await reseedWithImages(productImages);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
