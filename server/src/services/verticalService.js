import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getVerticalPreset, VERTICAL_PRESETS } from '../config/verticalPresets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE = path.join(__dirname, '../../data/seller-verticals.json');

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Read settings map
function readSettings() {
  ensureDataDir();
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Could not read seller-verticals.json:', err.message);
  }
  return {};
}

// Write settings map
function writeSettings(settings) {
  ensureDataDir();
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write seller-verticals.json:', err.message);
  }
}

/**
 * Get vertical settings for a seller
 */
export function getSellerVerticalSettings(sellerId) {
  const allSettings = readSettings();
  const sellerData = allSettings[sellerId] || {};

  const verticalId = sellerData.vertical || 'electronics';
  const preset = getVerticalPreset(verticalId);

  // Default enabled modules from preset if none specified
  const enabledModules = sellerData.enabledModules ||
    (preset.availableModules ? preset.availableModules.filter(m => m.defaultEnabled).map(m => m.id) : []);

  return {
    vertical: verticalId,
    enabledModules,
    customAttributes: sellerData.customAttributes || [],
    preset,
  };
}

/**
 * Update vertical settings for a seller
 */
export function updateSellerVerticalSettings(sellerId, { vertical, enabledModules, customAttributes }) {
  const allSettings = readSettings();
  const current = allSettings[sellerId] || {};

  const updated = {
    ...current,
    vertical: vertical || current.vertical || 'electronics',
    enabledModules: Array.isArray(enabledModules) ? enabledModules : current.enabledModules,
    customAttributes: Array.isArray(customAttributes) ? customAttributes : (current.customAttributes || []),
    updatedAt: new Date().toISOString(),
  };

  allSettings[sellerId] = updated;
  writeSettings(allSettings);

  return getSellerVerticalSettings(sellerId);
}

/**
 * Normalizes a raw database product into the decoupled Parent / Variant model.
 * Guarantees that every product has:
 * - `variants`: Array of { id, sku, price, compareAtPrice, stock, attributes: {}, metadata: {} }
 * - `brand`: String
 * - `category`: String
 * - `colors`: Extracted color array for backward compatibility
 * - `basePrice`: Lowest variant price
 * - `totalStock`: Sum of all variant stocks
 */
export function normalizeProductWithVariants(rawProduct, storeVertical = 'electronics') {
  if (!rawProduct) return null;

  let parsedImages = [];
  try {
    parsedImages = rawProduct.images ? JSON.parse(rawProduct.images) : [];
  } catch {
    parsedImages = [];
  }

  let rawColorsData = null;
  try {
    rawColorsData = rawProduct.colors ? JSON.parse(rawProduct.colors) : null;
  } catch {
    rawColorsData = null;
  }

  let variants = [];
  let brand = rawProduct.brand || '';
  let category = rawProduct.category || '';
  let vertical = storeVertical;
  let colorsForLegacy = [];

  // Check if rawColorsData contains the modern decoupled variants payload
  if (rawColorsData && typeof rawColorsData === 'object' && !Array.isArray(rawColorsData) && rawColorsData.__isMultiVariant) {
    variants = rawColorsData.variants || [];
    brand = rawColorsData.brand || brand;
    category = rawColorsData.category || category;
    vertical = rawColorsData.vertical || vertical;

    // Extract color swatches for backward-compatible rendering
    variants.forEach((v) => {
      if (v.attributes && v.attributes.color && typeof v.attributes.color === 'object') {
        const c = v.attributes.color;
        if (!colorsForLegacy.some((existing) => existing.name === c.name)) {
          colorsForLegacy.push(c);
        }
      }
    });
  } else if (Array.isArray(rawColorsData) && rawColorsData.length > 0) {
    // Legacy format: Array of colors [{ name, hex }]
    colorsForLegacy = rawColorsData;
    const basePrice = rawProduct.price || 0;
    const stockPerColor = Math.max(1, Math.floor((rawProduct.stock || 0) / rawColorsData.length));

    // Synthesize sellable SKU variants from legacy colors with vertical blueprint attributes
    variants = rawColorsData.map((colorObj, idx) => {
      const defaultAttributes = { color: colorObj };
      if (storeVertical === 'electronics') {
        defaultAttributes.storage = '256GB';
        defaultAttributes.condition = 'Brand New';
      } else if (storeVertical === 'apparel') {
        defaultAttributes.size = 'L';
      } else if (storeVertical === 'footwear') {
        defaultAttributes.size_eu = '42';
      } else if (storeVertical === 'perishables') {
        defaultAttributes.volume_weight = '100ml';
      }

      return {
        id: `${rawProduct.id}-v${idx + 1}`,
        sku: `${rawProduct.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${colorObj.name.toUpperCase().slice(0, 3)}`,
        price: basePrice,
        compareAtPrice: null,
        stock: stockPerColor,
        attributes: defaultAttributes,
        metadata: {},
      };
    });
  } else {
    // Single variant with no specific colors
    variants = [
      {
        id: `${rawProduct.id}-v1`,
        sku: `${rawProduct.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-STD`,
        price: rawProduct.price || 0,
        compareAtPrice: null,
        stock: rawProduct.stock || 0,
        attributes: {},
        metadata: {},
      },
    ];
  }

  // Calculate pricing & stock rollups
  const prices = variants.map((v) => Number(v.price) || 0).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : (rawProduct.price || 0);
  const maxPrice = prices.length > 0 ? Math.max(...prices) : (rawProduct.price || 0);
  const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  return {
    ...rawProduct,
    images: parsedImages,
    colors: colorsForLegacy,
    variants,
    brand,
    category,
    vertical,
    price: minPrice,
    maxPrice,
    stock: totalStock,
  };
}

/**
 * Packages variants into the database payload for Product.colors
 */
export function packageVariantsForStorage({ variants, brand, category, vertical, legacyColors }) {
  return JSON.stringify({
    __isMultiVariant: true,
    vertical: vertical || 'electronics',
    brand: brand || '',
    category: category || '',
    variants: (variants || []).map((v, i) => ({
      id: v.id || `var-${Date.now()}-${i}`,
      sku: v.sku || `SKU-${Date.now().toString().slice(-4)}-${i + 1}`,
      price: parseFloat(v.price) || 0,
      compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
      stock: parseInt(v.stock, 10) >= 0 ? parseInt(v.stock, 10) : 0,
      attributes: v.attributes || {},
      metadata: v.metadata || {},
    })),
    legacyColors: legacyColors || [],
  });
}
