import { useState, useEffect } from 'react';
import ProductCarousel from './ProductCarousel';
import ColorPicker from './ColorPicker';
import { translations, formatCurrency } from '../utils/i18n';

function EditProductPage({ productId, user, lang, onBack, onSaveSuccess, onCurrencyChange, onLangChange }) {
  const t = translations[lang] || translations.en;
  const currentCurrency = user?.currency || 'EGP';
  const isAr = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [colors, setColors] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  const token = localStorage.getItem('sellerToken');

  // Load product data from backend
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.status === 'success' && data.product) {
          const p = data.product;
          setName(p.name || '');
          setDescription(p.description || '');
          setPrice(p.price !== undefined ? p.price : '');
          setStock(p.stock !== undefined ? p.stock : '');
          setColors(Array.isArray(p.colors) ? p.colors : []);
          setExistingImages(Array.isArray(p.images) ? p.images : []);
        } else {
          setError(data.message || 'Failed to load product details.');
        }
      } catch (err) {
        setError('Network error fetching product details.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, token]);

  // Handle new files upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const totalCount = existingImages.length + files.length;
    if (totalCount > 6) {
      setError(
        isAr
          ? `الحد الأقصى للصور هو ٦ صور. لديك ${existingImages.length} صور حالية.`
          : `Maximum 6 photos allowed. You already have ${existingImages.length} saved.`
      );
      return;
    }
    setNewFiles(files);
    setNewPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeExistingImage = (indexToRemove) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const removeNewFile = (indexToRemove) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    setNewPreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // Submit Save
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError(isAr ? 'يرجى إدخال اسم المنتج' : 'Please enter a product name.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError(isAr ? 'يرجى إدخال سعر صحيح' : 'Please enter a valid price.');
      return;
    }

    setSaving(true);
    try {
      let res;
      if (newFiles.length > 0) {
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('description', description.trim());
        formData.append('price', numPrice);
        formData.append('stock', parseInt(stock || 0, 10));
        formData.append('existingImages', JSON.stringify(existingImages));
        formData.append('colors', JSON.stringify(colors));
        newFiles.forEach((file) => formData.append('images', file));

        res = await fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      } else {
        res = await fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            price: numPrice,
            stock: parseInt(stock || 0, 10),
            existingImages: existingImages,
            colors: colors,
          }),
        });
      }

      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMsg(isAr ? 'تم حفظ التعديلات بنجاح!' : 'Product changes saved successfully!');
        if (onSaveSuccess) onSaveSuccess(data.product);
        setTimeout(() => {
          onBack();
        }, 1200);
      } else {
        setError(data.message || 'Failed to save product.');
      }
    } catch (err) {
      setError('Network error updating product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="full-screen-center">
        <div className="spinner"></div>
        <p className="status-loading">{isAr ? 'جاري تحميل تفاصيل المنتج...' : 'Loading product details...'}</p>
      </div>
    );
  }

  const allDisplayImages = [...existingImages, ...newPreviews];

  return (
    <div className="dashboard-shell edit-page-shell">
      {/* TOP NAVBAR */}
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <button type="button" className="btn-back-nav" onClick={onBack}>
              {isAr ? '→ العودة للمتجر' : '← Back to Catalog'}
            </button>
            <div className="brand-divider">/</div>
            <div>
              <h1 className="brand-title">{isAr ? 'تعديل تفاصيل المنتج' : 'Edit Product Details'}</h1>
              <span className="brand-subtitle">{user?.storeName}</span>
            </div>
          </div>

          <div className="navbar-actions">
            {/* Currency Selector */}
            <div className="selector-group">
              <select
                value={user?.currency || 'EGP'}
                onChange={(e) => onCurrencyChange && onCurrencyChange(e.target.value)}
                className="nav-select"
              >
                <option value="EGP">EGP (ج.م)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            {/* Language Toggle */}
            <div className="selector-group">
              <select
                value={lang}
                onChange={(e) => onLangChange && onLangChange(e.target.value)}
                className="nav-select"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* EDIT PAGE CONTENT */}
      <main className="dashboard-body edit-page-body">
        <div className="edit-page-header-row">
          <div>
            <h2 className="edit-product-heading">{name || (isAr ? 'تعديل المنتج' : 'Edit Product')}</h2>
            <span className="item-id-tag">ID: {productId}</span>
          </div>

          <div className="edit-header-actions">
            <button type="button" className="btn-secondary-action" onClick={onBack}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              className="btn-primary-action"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ كل التعديلات' : 'Save Changes')}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="edit-product-grid">
          {/* LEFT COLUMN: PHOTOS & PREVIEW */}
          <div className="edit-column-photos">
            <div className="panel-card shadow-lg">
              <div className="panel-header">
                <h3 className="panel-title">{isAr ? 'معرض صور المنتج' : 'Product Photos & Gallery'}</h3>
                <p className="panel-subtitle">
                  {isAr ? 'يمكنك إضافة حتى ٦ صور عالية الدقة (٢٥ ميجابايت للصورة)' : 'Upload up to 6 high-res photos (25MB per photo)'}
                </p>
              </div>

              {/* Large Carousel Preview */}
              <div className="edit-carousel-preview-wrap">
                <ProductCarousel images={allDisplayImages} name={name} height="280px" />
              </div>

              {/* Existing Photos Grid */}
              {existingImages.length > 0 && (
                <div className="edit-photos-section">
                  <label className="edit-section-label">
                    {isAr ? `الصور المحفوظة (${existingImages.length})` : `Saved Photos (${existingImages.length})`}
                  </label>
                  <div className="photo-preview-grid">
                    {existingImages.map((src, i) => (
                      <div key={i} className="photo-preview-box">
                        <img src={src} alt={`Saved ${i + 1}`} />
                        <span className="photo-number">{i + 1}</span>
                        <button
                          type="button"
                          className="photo-remove-btn"
                          onClick={() => removeExistingImage(i)}
                          title={isAr ? 'حذف الصورة' : 'Remove image'}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Photos Previews */}
              {newPreviews.length > 0 && (
                <div className="edit-photos-section">
                  <label className="edit-section-label font-emerald">
                    {isAr ? `الصور الجديدة المضافة (${newPreviews.length})` : `New Photos to Upload (${newPreviews.length})`}
                  </label>
                  <div className="photo-preview-grid">
                    {newPreviews.map((src, i) => (
                      <div key={i} className="photo-preview-box new-upload">
                        <img src={src} alt={`New upload ${i + 1}`} />
                        <span className="photo-number new">+{i + 1}</span>
                        <button
                          type="button"
                          className="photo-remove-btn"
                          onClick={() => removeNewFile(i)}
                          title={isAr ? 'إلغاء الصورة' : 'Cancel upload'}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Input */}
              {existingImages.length + newFiles.length < 6 && (
                <div className="form-field photo-upload-field">
                  <label htmlFor="edit-photos-input">
                    + {isAr ? 'إضافة صور إضافية' : 'Add More Photos'}
                  </label>
                  <input
                    id="edit-photos-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <span className="hint-text">
                    {isAr
                      ? `يمكنك إضافة ${6 - (existingImages.length + newFiles.length)} صور إضافية (بحد أقصى ٢٥ ميجابايت)`
                      : `You can add ${6 - (existingImages.length + newFiles.length)} more photos (up to 25MB each)`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: CORE PRODUCT DETAILS & COLOR VARIANTS */}
          <div className="edit-column-details">
            <div className="panel-card shadow-lg">
              <div className="panel-header">
                <h3 className="panel-title">{isAr ? 'بيانات المنتج والمخزون' : 'Product Info & Variants'}</h3>
                <p className="panel-subtitle">
                  {isAr ? 'عدّل الاسم والأسعار والألوان والكميات والوصف' : 'Update title, pricing, color options, stock, and descriptions'}
                </p>
              </div>

              {/* Product Title */}
              <div className="form-field">
                <label htmlFor="edit-name">{t.productTitleLabel}</label>
                <input
                  id="edit-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Google Pixel 9 Pro XL"
                  required
                />
              </div>

              {/* Price & Stock in 2 columns */}
              <div className="form-row-2">
                <div className="form-field">
                  <label htmlFor="edit-price">
                    {t.priceLabel} ({currentCurrency === 'EGP' ? 'ج.م' : '$'})
                  </label>
                  <div className="input-prefix-wrapper">
                    <span className="input-prefix">{currentCurrency === 'EGP' ? 'ج.م' : '$'}</span>
                    <input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="edit-stock">{t.stockQtyLabel}</label>
                  <input
                    id="edit-stock"
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* COLOR VARIANTS SECTION */}
              <div className="form-field edit-color-field-wrap">
                <label>
                  {isAr ? 'الألوان المتوفرة في المخزون' : 'Available Color Variants'}
                </label>
                <p className="field-hint-sub">
                  {isAr
                    ? 'حدد الألوان التي تمتلكها لهذا الموديل لظهورها على بطاقة المنتج'
                    : 'Select all color options in stock for this phone model to display on the card'}
                </p>
                <ColorPicker colors={colors} onChange={setColors} lang={lang} />
              </div>

              {/* Description */}
              <div className="form-field">
                <label htmlFor="edit-desc">{t.descLabel}</label>
                <textarea
                  id="edit-desc"
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.descPlaceholder}
                />
              </div>

              {/* Bottom Actions Bar */}
              <div className="edit-bottom-actions-row">
                <button
                  type="submit"
                  className="btn-cta"
                  disabled={saving}
                >
                  {saving ? (isAr ? 'جاري الحفظ...' : 'Saving Changes...') : (isAr ? 'حفظ التعديلات' : 'Save Product Changes')}
                </button>
                <button
                  type="button"
                  className="btn-cancel-edit-full"
                  onClick={onBack}
                >
                  {isAr ? 'إلغاء والعودة' : 'Cancel & Go Back'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default EditProductPage;
