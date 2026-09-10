import { useState, useEffect } from 'react';
import { translations, formatCurrency } from '../utils/i18n';
import ProductCarousel from './ProductCarousel';
import ColorPicker from './ColorPicker';
import SellerAnalytics from './SellerAnalytics';

// ── Icon Components ───────────────────────────────────────────────────────────
const IconEdit = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconDelete = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

// ── Main Component ────────────────────────────────────────────────────────────
function ProductManager({ user, lang, onNavigateEdit }) {
  const t = translations[lang] || translations.en;
  const currentCurrency = user?.currency || 'EGP';
  const isAr = lang === 'ar';

  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [successMsg, setSuccessMsg]   = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab]     = useState('inventory'); // 'inventory' | 'analytics'

  // ── Add Product Form State ─────────────────────────────────────────────────
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]             = useState('');
  const [stock, setStock]             = useState('');
  const [colors, setColors]           = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews]   = useState([]);
  const [adding, setAdding]           = useState(false);

  const token = localStorage.getItem('sellerToken');

  // ── File Selection for ADD form ────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 6) {
      setError(isAr ? 'يمكنك رفع ٦ صور كحد أقصى' : 'Maximum 6 photos allowed.');
      return;
    }
    setSelectedFiles(files);
    setFilePreviews(files.map(f => URL.createObjectURL(f)));
  };

  // ── Fetch Products ─────────────────────────────────────────────────────────
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setProducts(data.products || []);
      } else {
        setError(data.message || 'Failed to load products.');
      }
    } catch {
      setError('Network error loading products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalProducts  = products.length;
  const totalStock     = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const catalogValue   = products.reduce((acc, p) => acc + (Number(p.price) || 0) * (Number(p.stock) || 0), 0);
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ── Add Product ────────────────────────────────────────────────────
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMsg('');
    if (!name.trim()) { setError(isAr ? 'يرجى إدخال اسم المنتج' : 'Please enter a product name.'); return; }
    if (!price || parseFloat(price) <= 0) { setError(isAr ? 'يرجى إدخال سعر صحيح' : 'Please enter a valid price.'); return; }
    setAdding(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('price', parseFloat(price));
      formData.append('stock', parseInt(stock || 0, 10));
      formData.append('colors', JSON.stringify(colors));
      selectedFiles.forEach(f => formData.append('images', f));

      const res  = await fetch('/api/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMsg(isAr ? `تم إضافة "${data.product.name}" بنجاح!` : `"${data.product.name}" added!`);
        setName(''); setDescription(''); setPrice(''); setStock(''); setColors([]);
        setSelectedFiles([]); setFilePreviews([]);
        fetchProducts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(data.message || 'Failed to add product.');
      }
    } catch {
      setError('Network error adding product.');
    } finally {
      setAdding(false);
    }
  };

  // ── Delete Product ─────────────────────────────────────────────────────────
  const handleDeleteProduct = async (id, productName) => {
    if (!window.confirm(t.confirmDelete || `Delete "${productName}"?`)) return;
    try {
      const res  = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccessMsg(isAr ? `تم حذف "${productName}".` : `"${productName}" deleted.`);
        fetchProducts();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(data.message || 'Failed to delete product.');
      }
    } catch {
      setError('Network error deleting product.');
    }
  };

  // ── Quick Stock Adjuster (+ / - 1 unit) ──────────────────────────────────
  const handleQuickStockChange = async (product, delta) => {
    const currentStock = parseInt(product.stock, 10) || 0;
    const newStock = Math.max(0, currentStock + delta);
    if (newStock === currentStock) return;

    // Optimistic update so KPIs update instantaneously
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p));

    try {
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: product.name,
          price: product.price,
          stock: newStock,
        }),
      });
    } catch (err) {
      fetchProducts(); // Revert on failure
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="workspace-layout">

      {/* KPI BAR — CLEAN DESIGN WITHOUT EMOJI ICONS */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">{t.activeItems}</span>
          </div>
          <div className="kpi-value">{totalProducts}</div>
          <span className="kpi-subtext">{t.itemsListed}</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">{t.totalInventory}</span>
          </div>
          <div className="kpi-value">{totalStock} <span className="unit">{t.units}</span></div>
          <span className="kpi-subtext">{t.combinedStock}</span>
        </div>

        <div className="kpi-card highlight">
          <div className="kpi-header">
            <span className="kpi-label font-emerald">{t.catalogValue}</span>
          </div>
          <div className="kpi-value font-emerald">
            {formatCurrency(catalogValue, currentCurrency, lang)}
          </div>
          <span className="kpi-subtext">{t.totalValueSubtext}</span>
        </div>
      </section>

      {/* DASHBOARD TAB NAVIGATION */}
      <div className="dashboard-tabs-bar">
        <button
          type="button"
          className={`dashboard-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          {isAr ? 'إدارة المنتجات والمخزون' : 'Inventory & Catalog'}
        </button>
        <button
          type="button"
          className={`dashboard-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          {isAr ? 'تحليلات الإيرادات ونمو الأعمال' : 'Revenue & Business Intelligence'}
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <SellerAnalytics products={products} currency={currentCurrency} lang={lang} />
      ) : (
        /* TWO-COLUMN WORKSPACE */
        <div className="workspace-columns">

        {/* LEFT: ADD PRODUCT FORM */}
        <aside className="workspace-sidebar">
          <div className="panel-card shadow-lg">
            <div className="panel-header">
              <h3 className="panel-title">{t.addNewProduct}</h3>
              <p className="panel-subtitle">{t.addSubtitle}</p>
            </div>

            {error      && <div className="alert alert-error">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            <form onSubmit={handleAddProduct} className="styled-form">
              <div className="form-field">
                <label htmlFor="pname">{t.productTitleLabel}</label>
                <input id="pname" type="text"
                  placeholder={isAr ? 'مثال: هاتف جوجل بيكسل ٩ برو' : 'e.g. Google Pixel 9 Pro'}
                  value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label htmlFor="pprice">{t.priceLabel} ({currentCurrency === 'EGP' ? 'ج.م' : '$'})</label>
                  <div className="input-prefix-wrapper">
                    <span className="input-prefix">{currentCurrency === 'EGP' ? 'ج.م' : '$'}</span>
                    <input id="pprice" type="number" step="0.01" placeholder="999"
                      value={price} onChange={e => setPrice(e.target.value)} required />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="pstock">{t.stockQtyLabel}</label>
                  <input id="pstock" type="number" placeholder="10"
                    value={stock} onChange={e => setStock(e.target.value)} required />
                </div>
              </div>

              {/* COLOR VARIANTS SELECTOR */}
              <div className="form-field">
                <label>{isAr ? 'الألوان المتوفرة في المخزون' : 'Color Variants in Stock'}</label>
                <ColorPicker colors={colors} onChange={setColors} lang={lang} />
              </div>

              {/* PHOTO UPLOADER */}
              <div className="form-field">
                <label htmlFor="pimages">
                  {isAr ? 'صور المنتج (حتى ٦ صور)' : 'Product Photos (Max 6)'}
                </label>
                <input id="pimages" type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple onChange={handleFileChange} className="file-input" />
                <span className="hint-text">
                  {isAr ? 'حتى ٢٥ ميجابايت للصورة الواحدة' : 'Up to 25MB per photo (JPG, PNG, WEBP)'}
                </span>
                {filePreviews.length > 0 && (
                  <div className="photo-preview-grid">
                    {filePreviews.map((src, i) => (
                      <div key={i} className="photo-preview-box">
                        <img src={src} alt={`Preview ${i + 1}`} />
                        <span className="photo-number">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="pdesc">{t.descLabel}</label>
                <textarea id="pdesc" rows="3" placeholder={t.descPlaceholder}
                  value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <button type="submit" className="btn-cta" disabled={adding}>
                {adding ? t.creatingListing : t.createListingBtn}
              </button>
            </form>
          </div>
        </aside>

        {/* RIGHT: CATALOG */}
        <main className="workspace-main">
          <div className="panel-card shadow-lg">
            <div className="catalog-toolbar">
              <div>
                <h3 className="panel-title">{t.catalogTitle}</h3>
                <p className="panel-subtitle">{t.catalogSubtitle}</p>
              </div>
              <div className="search-wrapper">
                <input type="text" placeholder={t.searchPlaceholder}
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="search-input" />
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>{t.loadingCatalog}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <h4>{t.noProducts}</h4>
                <p>{t.noProductsSubtext}</p>
              </div>
            ) : (
              <div className="catalog-grid">
                {filteredProducts.map(product => (
                  <div key={product.id} className="catalog-item-card">
                    {/* Interactive Multi-Photo Gallery Carousel */}
                    <ProductCarousel images={product.images} name={product.name} height="200px" />

                    <div className="item-top">
                      <div className="item-title-wrap">
                        <h4 className="item-title">{product.name}</h4>
                        <span className="item-id-tag">ID: {product.id.slice(0, 6)}</span>
                      </div>
                      <div className="item-price-pill">
                        {formatCurrency(product.price, currentCurrency, lang)}
                      </div>
                    </div>

                    {/* COLOR VARIANTS SWATCHES ON CARD */}
                    {Array.isArray(product.colors) && product.colors.length > 0 && (
                      <div className="card-color-swatches-section">
                        <span className="card-colors-title">
                          {isAr ? 'الألوان المتاحة:' : 'Available Colors:'}
                        </span>
                        <div className="card-color-swatches-list">
                          {product.colors.map((c, idx) => (
                            <span
                              key={idx}
                              className="card-color-swatch-badge"
                              title={`${c.name} (${c.hex})`}
                            >
                              <span
                                className="card-color-dot"
                                style={{
                                  backgroundColor: c.hex,
                                  border:
                                    c.hex?.toLowerCase() === '#ffffff' || c.hex?.toLowerCase() === '#f5f0eb'
                                      ? '1px solid #d1d5db'
                                      : '1px solid rgba(0,0,0,0.15)',
                                }}
                              />
                              <span className="card-color-name">{c.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {product.description && (
                      <p className="item-description">{product.description}</p>
                    )}

                    <div className="item-footer">
                      <div className="stock-indicator">
                        <span className={`status-dot ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}></span>
                        <div className="stock-quick-stepper">
                          <button
                            type="button"
                            className="stock-stepper-btn"
                            title={isAr ? 'تقليل المخزون (تم إرسال طلب للمشتري)' : 'Decrease stock (1 order fulfilled)'}
                            onClick={() => handleQuickStockChange(product, -1)}
                            disabled={product.stock <= 0}
                          >
                            -
                          </button>
                          <span className="stock-count">
                            {product.stock > 0 ? `${product.stock} ${t.inStock}` : t.outOfStock}
                          </span>
                          <button
                            type="button"
                            className="stock-stepper-btn"
                            title={isAr ? 'زيادة المخزون (إضافة وحدة جديدة)' : 'Increase stock (add 1 unit)'}
                            onClick={() => handleQuickStockChange(product, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="item-actions">
                        {/* EDIT — Navigates to dedicated full-screen Edit Page */}
                        <button
                          type="button"
                          className="action-btn action-btn--edit"
                          title={isAr ? 'تعديل كامل لتفاصيل المنتج' : 'Edit full product details'}
                          onClick={() => onNavigateEdit && onNavigateEdit(product.id)}
                        >
                          <IconEdit />
                        </button>

                        {/* DELETE — orange-red rounded trash */}
                        <button
                          type="button"
                          className="action-btn action-btn--delete"
                          title={t.delete}
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                        >
                          <IconDelete />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      )}
    </div>
  );
}

export default ProductManager;
