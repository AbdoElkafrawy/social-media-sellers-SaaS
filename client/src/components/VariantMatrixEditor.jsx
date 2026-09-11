import React, { useState } from 'react';
import { getVerticalPreset } from '../utils/verticalPresets';
import { formatCurrency } from '../utils/i18n';

/**
 * VariantMatrixEditor
 * Professional SKU and variant configuration tool for merchants.
 * Allows rapid matrix generation from vertical blueprints (e.g. Size × Color)
 * or granular per-variant editing.
 */
export default function VariantMatrixEditor({
  variants = [],
  onChangeVariants,
  vertical = 'electronics',
  currency = 'EGP',
  lang = 'en',
  basePrice = 0,
}) {
  const isAr = lang === 'ar';
  const preset = getVerticalPreset(vertical);

  const [isMatrixGeneratorOpen, setIsMatrixGeneratorOpen] = useState(false);
  const [selectedAttrOptions, setSelectedAttrOptions] = useState({});
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  // Toggle option selection in generator
  const toggleGeneratorOption = (attrKey, optionValue) => {
    setSelectedAttrOptions((prev) => {
      const current = prev[attrKey] || [];
      const exists = current.some((opt) =>
        typeof opt === 'object' && opt.name
          ? opt.name === (typeof optionValue === 'object' ? optionValue.name : optionValue)
          : opt === optionValue
      );

      const updated = exists
        ? current.filter((opt) =>
            typeof opt === 'object' && opt.name
              ? opt.name !== (typeof optionValue === 'object' ? optionValue.name : optionValue)
              : opt !== optionValue
          )
        : [...current, optionValue];

      return { ...prev, [attrKey]: updated };
    });
  };

  // Generate Cartesian Product Matrix of selected options
  const handleGenerateMatrix = () => {
    const keys = Object.keys(selectedAttrOptions).filter(
      (k) => selectedAttrOptions[k] && selectedAttrOptions[k].length > 0
    );

    if (keys.length === 0) {
      alert(isAr ? 'يرجى اختيار خاصية واحدة على الأقل لتوليد المتغيرات' : 'Please select at least one attribute to generate variants.');
      return;
    }

    // Cartesian product helper
    const cartesian = (arrays) => {
      return arrays.reduce(
        (acc, curr) => acc.flatMap((d) => curr.map((e) => [...d, e])),
        [[]]
      );
    };

    const arraysToCombine = keys.map((k) => selectedAttrOptions[k]);
    const combinations = cartesian(arraysToCombine);

    const newGeneratedVariants = combinations.map((combo, idx) => {
      const attributes = {};
      keys.forEach((k, i) => {
        attributes[k] = combo[i];
      });

      // Build short code for SKU
      const skuParts = combo.map((val) => {
        if (typeof val === 'object' && val.name) return val.name.slice(0, 3).toUpperCase();
        return String(val).replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
      });

      return {
        id: `var-gen-${Date.now()}-${idx}`,
        sku: `SKU-${skuParts.join('-')}`,
        price: bulkPrice && parseFloat(bulkPrice) > 0 ? parseFloat(bulkPrice) : (parseFloat(basePrice) || 100),
        compareAtPrice: null,
        stock: bulkStock && parseInt(bulkStock, 10) >= 0 ? parseInt(bulkStock, 10) : 10,
        attributes,
        metadata: {},
      };
    });

    onChangeVariants(newGeneratedVariants);
    setIsMatrixGeneratorOpen(false);
  };

  // Update a specific field on a single variant
  const handleUpdateVariant = (index, field, value) => {
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChangeVariants(updated);
  };

  // Remove a variant
  const handleRemoveVariant = (index) => {
    const updated = variants.filter((_, i) => i !== index);
    onChangeVariants(updated);
  };

  // Add single empty custom variant
  const handleAddManualVariant = () => {
    const newVar = {
      id: `var-man-${Date.now()}`,
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      price: parseFloat(basePrice) || 100,
      compareAtPrice: null,
      stock: 10,
      attributes: {
        option: `Variant ${variants.length + 1}`,
      },
      metadata: {},
    };
    onChangeVariants([...variants, newVar]);
  };

  // Apply bulk price or stock to all variants
  const handleApplyBulkValues = () => {
    if (!bulkPrice && !bulkStock) return;
    const updated = variants.map((v) => ({
      ...v,
      price: bulkPrice && parseFloat(bulkPrice) > 0 ? parseFloat(bulkPrice) : v.price,
      stock: bulkStock && parseInt(bulkStock, 10) >= 0 ? parseInt(bulkStock, 10) : v.stock,
    }));
    onChangeVariants(updated);
    alert(isAr ? 'تم تطبيق القيم على جميع المتغيرات بنجاح!' : 'Bulk updates applied to all variants!');
  };

  return (
    <div className="variant-matrix-editor">
      <div className="matrix-editor-header">
        <div>
          <h4 className="matrix-title">
            {isAr ? 'متغيرات المنتج والـ SKUs (المقاسات / الألوان / السعات)' : 'Product Variants & Sellable SKUs'}
          </h4>
          <p className="matrix-subtitle">
            {isAr
              ? `حدد الأسعار والمخزون لكل متغير وفق مخطط ${preset.nameAr || preset.name}`
              : `Configure multi-dimensional pricing and stock inventory tailored for ${preset.name}`}
          </p>
        </div>

        <div className="matrix-header-actions">
          <button
            type="button"
            className="btn-open-generator"
            onClick={() => setIsMatrixGeneratorOpen(!isMatrixGeneratorOpen)}
          >
            {isMatrixGeneratorOpen
              ? (isAr ? 'إغلاق المولد الآلي' : 'Close Generator')
              : (isAr ? '⚡ توليد المتغيرات تلقائياً' : '⚡ Generate Variants Matrix')}
          </button>
          <button
            type="button"
            className="btn-add-manual-variant"
            onClick={handleAddManualVariant}
          >
            {isAr ? '+ إضافة متغير يدوي' : '+ Add Single SKU'}
          </button>
        </div>
      </div>

      {/* MATRIX GENERATOR WIZARD */}
      {isMatrixGeneratorOpen && (
        <div className="matrix-generator-panel">
          <div className="generator-badge">
            <span>{preset.icon} {preset.name} Blueprint</span>
          </div>

          <p className="generator-hint">
            {isAr
              ? 'اختر الخصائص المتاحة لهذا المنتج (مثلاً المقاسات والألوان)، وسيقوم النظام بتوليد جدول الـ SKUs بالكامل:'
              : 'Select the options that apply to this product, and the generator will create all SKU combinations automatically:'}
          </p>

          <div className="blueprint-attributes-list">
            {preset.attributeBlueprints.map((blueprint) => {
              const selectedList = selectedAttrOptions[blueprint.key] || [];

              return (
                <div key={blueprint.key} className="blueprint-attr-box">
                  <label className="blueprint-attr-label">
                    {isAr ? (blueprint.labelAr || blueprint.label) : blueprint.label}
                  </label>

                  <div className="blueprint-options-grid">
                    {blueprint.options.map((opt, idx) => {
                      const optName = typeof opt === 'object' ? opt.name : opt;
                      const isSelected = selectedList.some((item) =>
                        typeof item === 'object' ? item.name === optName : item === optName
                      );

                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`blueprint-option-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleGeneratorOption(blueprint.key, opt)}
                        >
                          {typeof opt === 'object' && opt.hex && (
                            <span className="chip-color-dot" style={{ backgroundColor: opt.hex }} />
                          )}
                          <span>{optName}</span>
                          {isSelected && <span className="chip-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Bulk Inputs */}
          <div className="generator-bulk-row">
            <div className="bulk-input-group">
              <label>{isAr ? 'السعر الافتراضي لكل متغير:' : 'Default Variant Price:'}</label>
              <input
                type="number"
                placeholder={basePrice ? String(basePrice) : '0'}
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="input-field-small"
              />
            </div>
            <div className="bulk-input-group">
              <label>{isAr ? 'الكمية الافتراضية بالمخزن:' : 'Default Stock Count:'}</label>
              <input
                type="number"
                placeholder="10"
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
                className="input-field-small"
              />
            </div>

            <button
              type="button"
              className="btn-run-generator"
              onClick={handleGenerateMatrix}
            >
              {isAr ? 'توليد جدول المتغيرات الآن' : 'Create Combinations Matrix'}
            </button>
          </div>
        </div>
      )}

      {/* VARIANTS TABLE */}
      {variants.length === 0 ? (
        <div className="empty-variants-box">
          <p>
            {isAr
              ? 'لم يتم إضافة متغيرات بعد. يمكنك الضغط على "توليد المتغيرات تلقائياً" لاختيار الألوان والمقاسات دفعة واحدة.'
              : 'No variants configured yet. Use the "Generate Variants Matrix" button above to quickly generate SKUs.'}
          </p>
        </div>
      ) : (
        <div className="variants-table-container">
          <div className="variants-table-toolbar">
            <span className="variants-count-label">
              {variants.length} {isAr ? 'متغيرات مسجلة' : 'SKU Variants'}
            </span>

            <div className="bulk-actions-toolbar">
              <input
                type="number"
                placeholder={isAr ? 'السعر للكل' : 'Price for all'}
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="toolbar-input"
              />
              <input
                type="number"
                placeholder={isAr ? 'المخزون للكل' : 'Stock for all'}
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
                className="toolbar-input"
              />
              <button
                type="button"
                className="btn-apply-bulk"
                onClick={handleApplyBulkValues}
              >
                {isAr ? 'تطبيق على الكل' : 'Apply Bulk'}
              </button>
            </div>
          </div>

          <table className="variants-data-table">
            <thead>
              <tr>
                <th>{isAr ? 'الخصائص والمواصفات' : 'Attributes & Spec'}</th>
                <th style={{ width: '130px' }}>{isAr ? 'كود الـ SKU' : 'SKU Code'}</th>
                <th style={{ width: '130px' }}>{isAr ? `السعر (${currency})` : `Price (${currency})`}</th>
                <th style={{ width: '130px' }}>{isAr ? 'سعر المقارنة' : 'Compare Price'}</th>
                <th style={{ width: '100px' }}>{isAr ? 'المخزون' : 'Stock'}</th>
                <th style={{ width: '60px' }}>{isAr ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, idx) => {
                const attrs = v.attributes || {};

                return (
                  <tr key={v.id || idx}>
                    <td>
                      <div className="table-variant-attributes">
                        {Object.entries(attrs).map(([key, val]) => {
                          const isColor = typeof val === 'object' && val.name;
                          return (
                            <span key={key} className="table-attr-pill">
                              <span className="table-attr-key">{key}:</span>
                              {isColor && (
                                <span className="table-attr-color-dot" style={{ backgroundColor: val.hex }} />
                              )}
                              <span className="table-attr-val">{isColor ? val.name : String(val)}</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td>
                      <input
                        type="text"
                        value={v.sku || ''}
                        onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                        className="table-cell-input"
                        placeholder="SKU-001"
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={v.price !== undefined ? v.price : ''}
                        onChange={(e) => handleUpdateVariant(idx, 'price', parseFloat(e.target.value) || 0)}
                        className="table-cell-input bold"
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={v.compareAtPrice !== null && v.compareAtPrice !== undefined ? v.compareAtPrice : ''}
                        onChange={(e) =>
                          handleUpdateVariant(
                            idx,
                            'compareAtPrice',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        className="table-cell-input"
                        placeholder="Optional"
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        value={v.stock !== undefined ? v.stock : ''}
                        onChange={(e) => handleUpdateVariant(idx, 'stock', parseInt(e.target.value, 10) || 0)}
                        className={`table-cell-input ${v.stock <= 0 ? 'stock-empty' : ''}`}
                      />
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-delete-row"
                        onClick={() => handleRemoveVariant(idx)}
                        title={isAr ? 'حذف المتغير' : 'Delete variant'}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
