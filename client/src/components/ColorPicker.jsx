import { useState, useRef } from 'react';

const PRESET_COLORS = [
  { name: 'Obsidian', hex: '#1c1c1e' },
  { name: 'Porcelain', hex: '#f5f0eb' },
  { name: 'Hazel', hex: '#7a705e' },
  { name: 'Rose Quartz', hex: '#e8c4c4' },
  { name: 'Bay Blue', hex: '#4a7b9d' },
  { name: 'Mint Green', hex: '#a3d9c9' },
  { name: 'Sage', hex: '#7c9a7e' },
  { name: 'Coral', hex: '#e8784a' },
  { name: 'Midnight', hex: '#1a2238' },
  { name: 'Starlight', hex: '#eae5d9' },
  { name: 'Deep Black', hex: '#111111' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Silver', hex: '#c0c0c0' },
  { name: 'Gold', hex: '#d4af37' },
  { name: 'Titanium Grey', hex: '#5a5d64' },
];

function ColorPicker({ colors = [], onChange, lang = 'en' }) {
  const [customName, setCustomName] = useState('');
  const [customHex, setCustomHex] = useState('#17A07E');
  const colorInputRef = useRef(null);

  const isAr = lang === 'ar';

  const handleAddPreset = (preset) => {
    // Avoid duplicate colors by name or hex
    if (
      colors.some(
        (c) =>
          c.name.toLowerCase() === preset.name.toLowerCase() ||
          c.hex.toLowerCase() === preset.hex.toLowerCase()
      )
    ) {
      return;
    }
    onChange([...colors, preset]);
  };

  const handleAddCustom = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const finalName = customName.trim() || (isAr ? `لون (${customHex})` : `Color (${customHex})`);

    // Avoid exact duplicate
    if (colors.some((c) => c.name.toLowerCase() === finalName.toLowerCase())) {
      setCustomName('');
      return;
    }

    const newColor = { name: finalName, hex: customHex };
    onChange([...colors, newColor]);
    setCustomName('');
  };

  const handleRemoveColor = (index, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onChange(colors.filter((_, i) => i !== index));
  };

  const handleOpenPicker = (e) => {
    if (colorInputRef.current) {
      if (typeof colorInputRef.current.showPicker === 'function') {
        try {
          colorInputRef.current.showPicker();
        } catch {
          colorInputRef.current.click();
        }
      } else {
        colorInputRef.current.click();
      }
    }
  };

  return (
    <div className="color-picker-container" onClick={(e) => e.stopPropagation()}>
      {/* Selected Colors Chips */}
      {colors.length > 0 && (
        <div className="selected-colors-list">
          {colors.map((c, i) => (
            <div key={i} className="color-chip">
              <span
                className="color-chip-dot"
                style={{
                  backgroundColor: c.hex,
                  border:
                    c.hex?.toLowerCase() === '#ffffff' || c.hex?.toLowerCase() === '#f5f0eb'
                      ? '1px solid #ccc'
                      : 'none',
                }}
              />
              <span className="color-chip-name">{c.name}</span>
              <button
                type="button"
                className="color-chip-remove"
                onClick={(e) => handleRemoveColor(i, e)}
                title={isAr ? 'إزالة اللون' : 'Remove color'}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preset Swatches Bar */}
      <div className="color-presets-wrapper">
        <span className="color-presets-label">
          {isAr ? 'اختر الألوان المتوفرة:' : 'Quick Select Colors:'}
        </span>
        <div className="color-presets-grid">
          {PRESET_COLORS.map((preset, i) => {
            const isSelected = colors.some(
              (c) =>
                c.name.toLowerCase() === preset.name.toLowerCase() ||
                c.hex.toLowerCase() === preset.hex.toLowerCase()
            );
            return (
              <button
                key={i}
                type="button"
                className={`preset-color-btn ${isSelected ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddPreset(preset);
                }}
                title={`${preset.name} (${preset.hex})`}
              >
                <span
                  className="preset-swatch-circle"
                  style={{
                    backgroundColor: preset.hex,
                    border:
                      preset.hex?.toLowerCase() === '#ffffff' || preset.hex?.toLowerCase() === '#f5f0eb'
                        ? '1px solid #d1d5db'
                        : '1px solid rgba(0,0,0,0.1)',
                  }}
                />
                <span className="preset-name">{preset.name}</span>
                {isSelected && <span className="preset-check">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* CUSTOM COLOR ADDER WITH COLOR PALETTE WHEEL */}
      <div className="custom-color-inline-row">
        {/* Color Palette Wheel Trigger - Label wrapping the native input */}
        <label
          className="color-wheel-button"
          title={isAr ? 'انقر لفتح لوحة اختيار الألوان' : 'Click to open color palette wheel'}
          onClick={handleOpenPicker}
        >
          <div className="color-wheel-disc">
            <div
              className="color-wheel-preview-dot"
              style={{ backgroundColor: customHex }}
            />
          </div>
          <span className="color-wheel-text">{customHex}</span>

          {/* Native Color Picker positioned right over the button */}
          <input
            ref={colorInputRef}
            type="color"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            className="wheel-color-input-overlay"
          />
        </label>

        {/* Custom Color Name Input */}
        <input
          type="text"
          placeholder={isAr ? 'اسم اللون (مثال: أزرق سماوي)' : 'Color name (e.g. Sky Blue)'}
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              handleAddCustom();
            }
          }}
          style={{
            color: '#1C1E21',
            backgroundColor: '#ffffff',
            border: '1.5px solid #C8C0B8',
            borderRadius: '8px',
            padding: '0.45rem 0.75rem',
            fontSize: '0.85rem',
            fontWeight: '600',
            flex: '1',
            minWidth: '100px',
            outline: 'none',
            opacity: 1,
            visibility: 'visible',
            display: 'block',
          }}
          className="custom-color-name-input"
        />

        {/* Add Button */}
        <button
          type="button"
          className="btn-custom-color-add"
          onClick={handleAddCustom}
        >
          {isAr ? 'إضافة' : 'Add'}
        </button>
      </div>
    </div>
  );
}

export default ColorPicker;
