import 'dotenv/config';
import { db } from './db.js';

const PIXEL_COLORS_MAP = {
  'Google Pixel 9 Pro XL': [
    { name: 'Obsidian', hex: '#1c1c1e' },
    { name: 'Porcelain', hex: '#f5f0eb' },
    { name: 'Hazel', hex: '#7a705e' },
    { name: 'Rose Quartz', hex: '#e8c4c4' },
  ],
  'Google Pixel 9 Pro': [
    { name: 'Obsidian', hex: '#1c1c1e' },
    { name: 'Porcelain', hex: '#f5f0eb' },
    { name: 'Hazel', hex: '#7a705e' },
    { name: 'Rose Quartz', hex: '#e8c4c4' },
  ],
  'Google Pixel 9': [
    { name: 'Obsidian', hex: '#1c1c1e' },
    { name: 'Porcelain', hex: '#f5f0eb' },
    { name: 'Wintergreen', hex: '#a3d9c9' },
    { name: 'Peony', hex: '#e87890' },
  ],
  'Google Pixel 9 Pro Fold': [
    { name: 'Obsidian', hex: '#1c1c1e' },
    { name: 'Porcelain', hex: '#f5f0eb' },
  ],
  'Google Pixel 8 Pro': [
    { name: 'Obsidian', hex: '#1c1c1e' },
    { name: 'Porcelain', hex: '#f5f0eb' },
    { name: 'Bay Blue', hex: '#4a7b9d' },
    { name: 'Mint', hex: '#a3d9c9' },
  ],
  'Google Pixel 8': [
    { name: 'Obsidian', hex: '#1c1c1e' },
    { name: 'Hazel', hex: '#7a705e' },
    { name: 'Rose', hex: '#e8c4c4' },
    { name: 'Mint', hex: '#a3d9c9' },
  ],
  'Google Pixel 8a': [
    { name: 'Obsidian', hex: '#1c1c1e' },
    { name: 'Porcelain', hex: '#f5f0eb' },
    { name: 'Bay Blue', hex: '#4a7b9d' },
    { name: 'Aloe Green', hex: '#8bc34a' },
  ],
  'Google Pixel 7 Pro': [
    { name: 'Obsidian', hex: '#1c1c1e' },
    { name: 'Snow White', hex: '#ffffff' },
    { name: 'Hazel', hex: '#7a705e' },
  ],
  'Google Pixel 7a': [
    { name: 'Charcoal', hex: '#2c2c2e' },
    { name: 'Snow White', hex: '#ffffff' },
    { name: 'Sea Blue', hex: '#87ceeb' },
    { name: 'Coral', hex: '#e8784a' },
  ],
  'Google Pixel 6a': [
    { name: 'Charcoal', hex: '#2c2c2e' },
    { name: 'Chalk White', hex: '#f5f5f5' },
    { name: 'Sage Green', hex: '#7c9a7e' },
  ],
};

async function updateColors() {
  console.log('\n🎨 Updating Google Pixel products with official color variants...\n');
  const seller = await db.orm.public.User.where({ email: 'googlepixel@seller.com' }).first();
  if (!seller) {
    console.error('❌ Seller not found');
    process.exit(1);
  }

  const products = await db.orm.public.Product.where({ userId: seller.id }).all();
  for (const p of products) {
    const colors = PIXEL_COLORS_MAP[p.name] || [
      { name: 'Black', hex: '#111111' },
      { name: 'White', hex: '#ffffff' },
    ];
    await db.orm.public.Product.where({ id: p.id }).update({
      colors: JSON.stringify(colors),
    });
    console.log(`  ✓ ${p.name}: ${colors.map(c => c.name).join(', ')}`);
  }

  console.log('\n✅ All Google Pixel products updated with color variants!\n');
  process.exit(0);
}

updateColors().catch(err => {
  console.error(err);
  process.exit(1);
});
