import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/i18n';

/**
 * DynamicVariantPicker
 * Intelligently inspects the product's variants and attribute schemas,
 * dynamically rendering appropriate controls (color swatches, pill buttons, etc.),
 * and updates stock, SKU, and pricing in real time.
 */
export default function DynamicVariantPicker({
  variants = [],
  selectedVariant,
  onSelectVariant,
  currency = 'EGP',
  lang = 'en',
  vertical = 'general',
  enabledModules = [],
}) {
  const isAr = lang === 'ar';

  // Extract all distinct attribute keys present across variants (e.g. ['storage', 'condition', 'color', 'size'])
  const attributeKeys = useMemo(() => {
    const keys = new Set();
    variants.forEach((v) => {
      if (v.attributes && typeof v.attributes === 'object') {
        Object.keys(v.attributes).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [variants]);

  // If product has 0 or 1 variant with no distinct attributes, no picker needed
  if (!variants || variants.length <= 1 && attributeKeys.length === 0) {
    return null;
  }

  // Get current selected attribute map
  const currentAttributes = selectedVariant?.attributes || {};

  // For a given attribute key, find all unique values available across all variants
  const getAttributeValues = (attrKey) => {
    const valueMap = new Map();
    variants.forEach((v) => {
      const val = v.attributes?.[attrKey];
      if (val !== undefined && val !== null) {
        if (typeof val === 'object' && val.name) {
          // Color object { name, hex }
          valueMap.set(val.name, val);
        } else {
          valueMap.set(String(val), val);
        }
      }
    });
    return Array.from(valueMap.values());
  };

  // Check if changing an attribute to a target value will produce an available/in-stock variant
  const handleAttributeChange = (attrKey, targetValue) => {
    const prospective = {
      ...currentAttributes,
      [attrKey]: targetValue,
    };

    // Find the best matching variant
    // Exact match first
    let matched = variants.find((v) => {
      return Object.entries(prospective).every(([k, val]) => {
        const vVal = v.attributes?.[k];
        if (typeof val === 'object' && val.name && typeof vVal === 'object' && vVal.name) {
          return val.name === vVal.name;
        }
        return String(val) === String(vVal);
      });
    });

    // If no exact match, find first variant that has targetValue for this attrKey
    if (!matched) {
      matched = variants.find((v) => {
        const vVal = v.attributes?.[attrKey];
        if (typeof targetValue === 'object' && targetValue.name && typeof vVal === 'object' && vVal.name) {
          return targetValue.name === vVal.name;
        }
        return String(targetValue) === String(vVal);
      });
    }

    if (matched && onSelectVariant) {
      onSelectVariant(matched);
    }
  };

  // Helper to format attribute label
  const formatAttrLabel = (key) => {
    const labels = {
      storage: isAr ? 'السعة التخزينية' : 'Storage',
      condition: isAr ? 'الحالة' : 'Condition',
      color: isAr ? 'اللون' : 'Color',
      colorway: isAr ? 'الكولور واي' : 'Colorway',
      size: isAr ? 'المقاس' : 'Size',
      size_eu: isAr ? 'المقاس (EU)' : 'Size (EU)',
      size_us: isAr ? 'المقاس (US)' : 'Size (US)',
      fit: isAr ? 'قصة الموديل' : 'Fit',
      ram: isAr ? 'الرام' : 'RAM',
      network: isAr ? 'الشبكة' : 'Network',
      volume_weight: isAr ? 'الحجم / الوزن' : 'Volume / Weight',
      shade_scent: isAr ? 'الرائحة / الدرجة' : 'Scent / Shade',
      material: isAr ? 'الخامة' : 'Material',
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
  };

  return (
    <div className="dynamic-variant-picker">
      {attributeKeys.map((attrKey) => {
        const values = getAttributeValues(attrKey);
        const isColorAttr = attrKey === 'color' || attrKey === 'colorway';
        const currentVal = currentAttributes[attrKey];

        return (
          <div key={attrKey} className="variant-attr-group">
            <div className="variant-attr-header">
              <span className="variant-attr-title">{formatAttrLabel(attrKey)}:</span>
              <span className="variant-attr-selected-value">
                {currentVal ? (typeof currentVal === 'object' ? currentVal.name : currentVal) : ''}
              </span>
            </div>

            {/* RENDER COLOR SWATCHES */}
            {isColorAttr ? (
              <div className="variant-swatches-row">
                {values.map((c, idx) => {
                  const isSelected =
                    currentVal &&
                    (typeof currentVal === 'object' ? currentVal.name === c.name : currentVal === c.name);

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`variant-swatch-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleAttributeChange(attrKey, c)}
                      title={c.name}
                    >
                      <span
                        className="swatch-circle"
                        style={{
                          backgroundColor: c.hex || '#ffffff',
                          border:
                            c.hex?.toLowerCase() === '#ffffff' || c.hex?.toLowerCase() === '#f5f0eb'
                              ? '1px solid #d1d5db'
                              : '1px solid rgba(0,0,0,0.12)',
                        }}
                      />
                      <span className="swatch-label">{c.name}</span>
                      {isSelected && <span className="swatch-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* RENDER PILL BUTTONS */
              <div className="variant-pills-row">
                {values.map((val, idx) => {
                  const valStr = typeof val === 'object' ? val.name : String(val);
                  const isSelected =
                    currentVal !== undefined &&
                    (typeof currentVal === 'object' ? currentVal.name === valStr : String(currentVal) === valStr);

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`variant-pill-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleAttributeChange(attrKey, val)}
                    >
                      {valStr}
                      {isSelected && <span className="pill-check"> ✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ACTIVE VARIANT SPEC BADGE */}
      {selectedVariant && (
        <div className="active-variant-summary-badge">
          <div className="variant-badge-left">
            {selectedVariant.sku && (
              <span className="sku-tag">SKU: {selectedVariant.sku}</span>
            )}
            <span className={`variant-stock-tag ${selectedVariant.stock > 0 ? 'in-stock' : 'out-stock'}`}>
              {selectedVariant.stock > 0
                ? `${selectedVariant.stock} ${isAr ? 'متوفر' : 'in stock'}`
                : isAr
                ? 'نفذت الكمية'
                : 'Out of Stock'}
            </span>
          </div>

          {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
            <div className="variant-badge-savings">
              <span className="compare-price">
                {formatCurrency(selectedVariant.compareAtPrice, currency, lang)}
              </span>
              <span className="save-tag">
                {isAr ? 'وفر ' : 'Save '}
                {formatCurrency(selectedVariant.compareAtPrice - selectedVariant.price, currency, lang)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
