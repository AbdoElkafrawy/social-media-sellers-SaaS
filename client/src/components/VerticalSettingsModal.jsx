import React, { useState } from 'react';
import { VERTICAL_PRESETS } from '../utils/verticalPresets';

/**
 * VerticalSettingsModal
 * Merchant dialog to configure store industry blueprint and feature modules.
 */
export default function VerticalSettingsModal({
  isOpen,
  onClose,
  currentVertical = 'electronics',
  currentModules = [],
  onSave,
  lang = 'en',
}) {
  const isAr = lang === 'ar';

  const [selectedVertical, setSelectedVertical] = useState(currentVertical);
  const [enabledModules, setEnabledModules] = useState(currentModules);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const activePreset = VERTICAL_PRESETS[selectedVertical] || VERTICAL_PRESETS.electronics;

  const handleSelectVertical = (verticalId) => {
    setSelectedVertical(verticalId);
    const newPreset = VERTICAL_PRESETS[verticalId];
    // Default enabled modules for the newly selected vertical
    const defaultMods = newPreset.availableModules
      ? newPreset.availableModules.filter((m) => m.defaultEnabled).map((m) => m.id)
      : [];
    setEnabledModules(defaultMods);
  };

  const handleToggleModule = (moduleId) => {
    setEnabledModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        vertical: selectedVertical,
        enabledModules,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to save vertical settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="vertical-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              {isAr ? 'تخصيص نشاط المتجر والمميزات التلقائية' : 'Store Industry Vertical & Feature Modules'}
            </h3>
            <p className="modal-sub">
              {isAr
                ? 'اختر نوع نشاطك لتفعيل الحقول المخصصة ومميزات البيع عبر السوشيال ميديا'
                : 'Choose your business vertical to unlock tailored product fields and conversational checkout features'}
            </p>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vertical-settings-body">
          {/* VERTICAL SELECTOR CARDS */}
          <label className="section-label">
            {isAr ? '١. اختر مجال المتجر (Blueprint):' : '1. Select Your Store Blueprint:'}
          </label>

          <div className="vertical-cards-grid">
            {Object.values(VERTICAL_PRESETS).map((preset) => {
              const isSelected = selectedVertical === preset.id;

              return (
                <div
                  key={preset.id}
                  className={`vertical-preset-card ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelectVertical(preset.id)}
                >
                  <div className="preset-card-top">
                    <span className="preset-icon">{preset.icon}</span>
                    <h4 className="preset-name">{isAr ? (preset.nameAr || preset.name) : preset.name}</h4>
                  </div>
                  <p className="preset-desc">{isAr ? (preset.descriptionAr || preset.description) : preset.description}</p>

                  <div className="preset-attributes-preview">
                    <span className="preview-label">{isAr ? 'الخصائص التلقائية:' : 'Default Spec:'}</span>
                    <div className="preview-pills">
                      {preset.attributeBlueprints.map((bp) => (
                        <span key={bp.key} className="preview-pill">
                          {isAr ? (bp.labelAr || bp.label) : bp.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MODULAR FEATURE GATING */}
          {activePreset.availableModules && activePreset.availableModules.length > 0 && (
            <div className="feature-modules-section">
              <label className="section-label">
                {isAr ? '٢. تفعيل المميزات المتقدمة للنشاط:' : '2. Active Modules & Gated Workflows:'}
              </label>

              <div className="modules-toggles-list">
                {activePreset.availableModules.map((module) => {
                  const isEnabled = enabledModules.includes(module.id);

                  return (
                    <div
                      key={module.id}
                      className={`module-toggle-card ${isEnabled ? 'enabled' : ''}`}
                      onClick={() => handleToggleModule(module.id)}
                    >
                      <div className="toggle-switch-wrap">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => {}}
                          className="toggle-checkbox"
                        />
                        <span className="toggle-slider"></span>
                      </div>

                      <div className="module-info">
                        <strong className="module-title">
                          {isAr ? (module.labelAr || module.label) : module.label}
                        </strong>
                        <p className="module-desc">
                          {isAr ? (module.descriptionAr || module.description) : module.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {saveSuccess && (
            <div className="save-success-alert">
              ✓ {isAr ? 'تم حفظ التعديلات وتحديث مخطط المتجر بنجاح!' : 'Store blueprint and modules updated successfully!'}
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="modal-footer">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" className="btn-modal-save" disabled={saving}>
              {saving
                ? (isAr ? 'جاري الحفظ...' : 'Saving...')
                : (isAr ? 'حفظ وتطبيق المخطط' : 'Save & Apply Blueprint')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
