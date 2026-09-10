import { useState, useEffect } from 'react';
import { translations, formatCurrency } from '../utils/i18n';
import ProductCarousel from './ProductCarousel';
import NotFoundPage from './NotFoundPage';

const IconCart = ({ size = 16, style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: '-2px', ...style }}
  >
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

function PublicStorefront({ storeId, backToDashboard }) {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lang, setLang] = useState(localStorage.getItem('appLang') || 'en');
  const [cart, setCart] = useState([]); // array of { id, product, color, qty }
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null); // for Product Detail Modal
  const [modalSelectedColor, setModalSelectedColor] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [currency, setCurrency] = useState('EGP');

  const t = translations[lang] || translations.en;
  const isAr = lang === 'ar';

  // Set document direction for Arabic vs English
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  }, [lang, isAr]);

  useEffect(() => {
    const fetchStorefront = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/store/${storeId}`);
        const data = await res.json();

        if (data.status === 'success') {
          setStore(data.store);
          setProducts(data.products || []);
          if (data.store?.currency) {
            setCurrency(data.store.currency);
          }
        } else {
          setError(data.message || 'Storefront not found.');
        }
      } catch (err) {
        setError('Network error loading storefront.');
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      fetchStorefront();
    }
  }, [storeId]);

  // Open Product Detail Modal
  const openProductModal = (product) => {
    setSelectedProduct(product);
    const firstColor = Array.isArray(product.colors) && product.colors.length > 0 ? product.colors[0] : null;
    setModalSelectedColor(firstColor);
    setModalQty(1);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setModalSelectedColor(null);
    setModalQty(1);
  };

  // Add Item to Cart from Modal
  const handleAddToCart = (product, color, qty) => {
    const colorName = color ? color.name : 'Standard';
    const cartItemId = `${product.id}-${colorName}`;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].qty += qty;
        return updated;
      }
      return [...prev, { cartItemId, product, color, qty }];
    });

    closeProductModal();
    setShowCartDrawer(true);
  };

  // Update Cart Item Quantity
  const updateCartItemQty = (cartItemId, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  // Direct 1-Click WhatsApp Order for a Single Product
  const handleDirectWhatsAppOrder = (product, color, qty) => {
    const colorText = color ? ` (${isAr ? 'اللون:' : 'Color:'} ${color.name})` : '';
    const itemTotal = formatCurrency(product.price * qty, currency, lang);

    let message = '';
    if (isAr) {
      message = `مرحباً! أود طلب المنتج التالي من متجر *${store.storeName}*:\n\n`;
      message += `*${product.name}*${colorText}\n`;
      message += `الكمية: ${qty}\n`;
      message += `السعر الإجمالي: ${itemTotal}\n\n`;
      message += `يرجى تأكيد توفر المنتج وتزويدي بتفاصيل الدفع والتوصيل. شكراً!`;
    } else {
      message = `Hi! I would like to order from *${store.storeName}*:\n\n`;
      message += `*${product.name}*${colorText}\n`;
      message += `Quantity: ${qty}\n`;
      message += `Total Price: ${itemTotal}\n\n`;
      message += `Please confirm product availability, payment, and delivery details. Thank you!`;
    }

    sendWhatsAppMessage(message);
  };

  // WhatsApp Order for Entire Cart
  const handleCheckoutCartWhatsApp = () => {
    if (cart.length === 0) return;
    const totalAmount = cart.reduce((acc, item) => acc + item.product.price * item.qty, 0);

    let message = '';
    if (isAr) {
      message = `مرحباً! أود طلب المنتجات التالية من متجر *${store.storeName}*:\n\n`;
      cart.forEach((item, i) => {
        const colorText = item.color ? ` - اللون: ${item.color.name}` : '';
        message += `${i + 1}. *${item.product.name}*${colorText} (${item.qty}x) = ${formatCurrency(item.product.price * item.qty, currency, 'ar')}\n`;
      });
      message += `\nإجمالي الطلب: ${formatCurrency(totalAmount, currency, 'ar')}\n\n`;
      message += `يرجى تأكيد الطلب وتزويدي بتفاصيل التوصيل والدفع!`;
    } else {
      message = `Hi! I would like to order the following from *${store.storeName}*:\n\n`;
      cart.forEach((item, i) => {
        const colorText = item.color ? ` - Color: ${item.color.name}` : '';
        message += `${i + 1}. *${item.product.name}*${colorText} (${item.qty}x) = ${formatCurrency(item.product.price * item.qty, currency, 'en')}\n`;
      });
      message += `\nTotal Order Amount: ${formatCurrency(totalAmount, currency, 'en')}\n\n`;
      message += `Please confirm my order and share delivery & payment details!`;
    }

    sendWhatsAppMessage(message);
  };

  // Helper to construct WhatsApp URL with clean seller number
  const sendWhatsAppMessage = (text) => {
    const rawNumber = store?.whatsappNumber || '';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');

    let whatsappUrl = '';
    if (cleanNumber.length > 5) {
      whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
    } else {
      whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    }

    window.open(whatsappUrl, '_blank');
  };

  // Copy Store Link to Clipboard
  const handleCopyStoreLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  if (loading) {
    return (
      <div className="full-screen-center">
        <div className="spinner"></div>
        <p className="status-loading">{isAr ? 'جاري تحميل المتجر...' : 'Loading Storefront...'}</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <NotFoundPage
        message={error}
        invalidId={storeId}
        onGoHome={backToDashboard || (() => (window.location.href = '/'))}
        lang={lang}
      />
    );
  }

  const totalCartCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const totalCartAmount = cart.reduce((acc, item) => acc + item.product.price * item.qty, 0);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="public-store-shell">
      {/* PUBLIC NAVBAR BANNER */}
      <header className="public-header">
        <div className="navbar-container">
          <div className="navbar-brand">
            <div>
              <h1 className="brand-title">{store.storeName}</h1>
              <span className="badge badge-success" style={{ marginTop: '0.2rem' }}>
                {isAr ? 'متجر موثق' : 'Verified Store'}
              </span>
            </div>
          </div>

          <div className="navbar-actions">
            {/* Share Link Button */}
            <button type="button" className="btn-icon" onClick={handleCopyStoreLink}>
              {copiedLink ? (isAr ? 'تم نسخ الرابط' : 'Copied Link') : (isAr ? 'مشاركة الرابط' : 'Share Link')}
            </button>

            {/* Cart Button */}
            <button
              type="button"
              className="btn-store-preview highlight-cart-btn"
              onClick={() => setShowCartDrawer(true)}
            >
              <IconCart size={15} style={{ marginRight: isAr ? 0 : '0.35rem', marginLeft: isAr ? '0.35rem' : 0 }} />
              {isAr ? 'السلة' : 'Cart'}
              {totalCartCount > 0 && <span className="cart-badge-count">{totalCartCount}</span>}
            </button>

            {/* Currency Selector */}
            <div className="selector-group">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="nav-select"
                title={isAr ? 'تغيير العملة' : 'Change Currency'}
              >
                <option value="EGP">EGP (ج.م)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            {/* Language Switcher */}
            <div className="selector-group">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="nav-select"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            {backToDashboard && (
              <button type="button" className="btn-logout" onClick={backToDashboard}>
                {isAr ? '← لوحة التحكم' : '← Dashboard'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="public-store-hero">
        <div className="hero-content-wrap">
          <div className="hero-store-text">
            <h2 className="hero-store-title">{store.storeName}</h2>
            <p className="hero-store-subtitle">
              {isAr
                ? 'تصفح أحدث الأجهزة والموديلات واختر لونك المفضل واطلب مباشرة عبر الواتساب'
                : 'Browse our devices, select your color variant, and order directly via WhatsApp'}
            </p>
            {store.whatsappNumber && (
              <span className="hero-whatsapp-badge">
                {isAr ? 'واتساب المتجر:' : 'Store WhatsApp:'} {store.whatsappNumber}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* STOREFRONT MAIN CONTENT — FULL WIDTH EXPANSIVE 3+ CARDS GRID */}
      <main className="public-store-body">
        {/* CATALOG HEADER & SEARCH BAR */}
        <div className="public-catalog-toolbar">
          <div>
            <h3 className="public-section-title">
              {isAr ? 'كتالوج المنتجات' : 'Product Catalog'}
            </h3>
            <p className="public-section-sub">
              {isAr
                ? `اضغط على أي جهاز لمعاينة التفاصيل واختيار اللون والطلب (${filteredProducts.length} جهاز معروض)`
                : `Click any device to view specs, select your color & order (${filteredProducts.length} devices available)`}
            </p>
          </div>

          <div className="search-wrapper public-search">
            <input
              type="text"
              placeholder={isAr ? 'البحث عن منتج أو مواصفات...' : 'Search devices or specs...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* 3+ CARDS PER ROW EXPANSIVE GRID */}
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <h4>{isAr ? 'لا توجد منتجات مطابقة للبحث' : 'No products match your search'}</h4>
          </div>
        ) : (
          <div className="public-catalog-grid-3col">
            {filteredProducts.map((product) => {
              const hasColors = Array.isArray(product.colors) && product.colors.length > 0;
              const inStock = product.stock > 0;

              return (
                <div
                  key={product.id}
                  className="public-product-card"
                  onClick={() => openProductModal(product)}
                >
                  {/* Photo Carousel Preview */}
                  <ProductCarousel images={product.images} name={product.name} height="220px" />

                  <div className="public-card-content">
                    <div className="public-card-header">
                      <div className="public-card-title-group">
                        <h4 className="public-card-title">{product.name}</h4>
                        <span className="public-stock-tag">
                          <span className={`status-dot ${inStock ? 'in-stock' : 'out-stock'}`} />
                          {inStock ? `${product.stock} ${t.inStock}` : t.outOfStock}
                        </span>
                      </div>
                      <div className="item-price-pill font-emerald">
                        {formatCurrency(product.price, currency, lang)}
                      </div>
                    </div>

                    {/* Color Swatches Preview */}
                    {hasColors && (
                      <div className="public-card-colors-row">
                        <span className="public-colors-label">
                          {isAr ? 'الألوان:' : 'Colors:'}
                        </span>
                        <div className="public-color-dots">
                          {product.colors.map((c, idx) => (
                            <span
                              key={idx}
                              className="public-color-dot-wrap"
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
                            </span>
                          ))}
                          <span className="public-color-count">
                            ({product.colors.length} {isAr ? 'ألوان' : 'colors'})
                          </span>
                        </div>
                      </div>
                    )}

                    {product.description && (
                      <p className="public-card-desc">{product.description}</p>
                    )}

                    {/* Action Button */}
                    <div className="public-card-footer">
                      <button
                        type="button"
                        className="btn-view-product-details"
                        onClick={(e) => {
                          e.stopPropagation();
                          openProductModal(product);
                        }}
                      >
                        {isAr ? 'عرض التفاصيل والطلب' : 'View Details & Order'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ====================================================================
          PRODUCT DETAIL MODAL (SPECS, COLOR SELECTION, QTY, WHATSAPP ORDER)
          ==================================================================== */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={closeProductModal}>
          <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-detail-header">
              <div>
                <h3 className="modal-product-title">{selectedProduct.name}</h3>
                <span className="item-id-tag">ID: {selectedProduct.id.slice(0, 6)}</span>
              </div>
              <button type="button" className="btn-close-detail-modal" onClick={closeProductModal}>
                ✕
              </button>
            </div>

            <div className="modal-detail-body">
              {/* Left: Photos Carousel */}
              <div className="modal-detail-media">
                <ProductCarousel
                  images={selectedProduct.images}
                  name={selectedProduct.name}
                  height="300px"
                />
              </div>

              {/* Right: Info, Colors, Quantity, Pricing & Order CTA */}
              <div className="modal-detail-info">
                <div className="modal-price-stock-row">
                  <div className="modal-price-tag font-emerald">
                    {formatCurrency(selectedProduct.price, currency, lang)}
                  </div>
                  <span className="public-stock-tag large">
                    <span className={`status-dot ${selectedProduct.stock > 0 ? 'in-stock' : 'out-stock'}`} />
                    {selectedProduct.stock > 0 ? `${selectedProduct.stock} ${t.inStock}` : t.outOfStock}
                  </span>
                </div>

                {/* Description / Specs */}
                {selectedProduct.description && (
                  <div className="modal-desc-box">
                    <h5 className="modal-desc-heading">{isAr ? 'المواصفات والتفاصيل:' : 'Specifications & Details:'}</h5>
                    <p className="modal-desc-text">{selectedProduct.description}</p>
                  </div>
                )}

                {/* COLOR SELECTION SECTION */}
                {Array.isArray(selectedProduct.colors) && selectedProduct.colors.length > 0 && (
                  <div className="modal-color-selector-section">
                    <label className="modal-selector-label">
                      {isAr ? 'اختر اللون المطلوب:' : 'Select Color:'}
                      {modalSelectedColor && (
                        <strong className="selected-color-name"> {modalSelectedColor.name}</strong>
                      )}
                    </label>

                    <div className="modal-color-swatches-grid">
                      {selectedProduct.colors.map((c, idx) => {
                        const isSelected =
                          modalSelectedColor && modalSelectedColor.name === c.name;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`modal-color-btn ${isSelected ? 'active' : ''}`}
                            onClick={() => setModalSelectedColor(c)}
                          >
                            <span
                              className="modal-color-dot"
                              style={{
                                backgroundColor: c.hex,
                                border:
                                  c.hex?.toLowerCase() === '#ffffff' || c.hex?.toLowerCase() === '#f5f0eb'
                                    ? '1px solid #d1d5db'
                                    : '1px solid rgba(0,0,0,0.15)',
                              }}
                            />
                            <span className="modal-color-btn-name">{c.name}</span>
                            {isSelected && <span className="color-check">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* QUANTITY SELECTOR */}
                <div className="modal-qty-section">
                  <label className="modal-selector-label">{isAr ? 'الكمية:' : 'Quantity:'}</label>
                  <div className="modal-qty-control-row">
                    <div className="cart-qty-controls large">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                        disabled={modalQty <= 1}
                      >
                        -
                      </button>
                      <span className="qty-number">{modalQty}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => setModalQty((q) => Math.min(selectedProduct.stock || 100, q + 1))}
                        disabled={modalQty >= (selectedProduct.stock || 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="modal-subtotal-box">
                      <span className="subtotal-label">{isAr ? 'الإجمالي:' : 'Subtotal:'}</span>
                      <strong className="subtotal-amount font-emerald">
                        {formatCurrency(selectedProduct.price * modalQty, currency, lang)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* ACTIONS: DIRECT WHATSAPP ORDER & ADD TO CART */}
                <div className="modal-action-buttons">
                  <button
                    type="button"
                    className="btn-direct-whatsapp-cta"
                    disabled={selectedProduct.stock <= 0}
                    onClick={() => handleDirectWhatsAppOrder(selectedProduct, modalSelectedColor, modalQty)}
                  >
                    {isAr ? 'طلب عبر الواتساب' : 'Order via WhatsApp'}
                  </button>

                  <button
                    type="button"
                    className="btn-add-to-cart-cta"
                    disabled={selectedProduct.stock <= 0}
                    onClick={() => handleAddToCart(selectedProduct, modalSelectedColor, modalQty)}
                  >
                    <IconCart size={16} style={{ marginRight: isAr ? 0 : '0.4rem', marginLeft: isAr ? '0.4rem' : 0 }} />
                    {isAr ? 'إضافة إلى السلة' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          CART DRAWER / ORDER SUMMARY MODAL
          ==================================================================== */}
      {showCartDrawer && (
        <div className="modal-backdrop" onClick={() => setShowCartDrawer(false)}>
          <div className="cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <h3 className="cart-drawer-title">
                <IconCart size={18} style={{ marginRight: isAr ? 0 : '0.4rem', marginLeft: isAr ? '0.4rem' : 0 }} />
                {isAr ? 'سلة الطلبات' : 'Order Cart'} ({totalCartCount})
              </h3>
              <button
                type="button"
                className="btn-close-detail-modal"
                onClick={() => setShowCartDrawer(false)}
              >
                ✕
              </button>
            </div>

            <div className="cart-drawer-body">
              {cart.length === 0 ? (
                <div className="empty-cart-msg">
                  <p>{isAr ? 'سلة الطلبات فارغة حالياً' : 'Your cart is currently empty.'}</p>
                </div>
              ) : (
                <div className="cart-items-drawer-list">
                  {cart.map((item) => (
                    <div key={item.cartItemId} className="cart-drawer-item-card">
                      <div className="cart-drawer-item-info">
                        <strong className="cart-item-title">{item.product.name}</strong>
                        {item.color && (
                          <div className="cart-item-color-pill">
                            <span
                              className="card-color-dot"
                              style={{ backgroundColor: item.color.hex }}
                            />
                            <span>{item.color.name}</span>
                          </div>
                        )}
                        <span className="cart-item-single-price">
                          {formatCurrency(item.product.price, currency, lang)}
                        </span>
                      </div>

                      <div className="cart-drawer-item-controls">
                        <div className="cart-qty-controls">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => updateCartItemQty(item.cartItemId, -1)}
                          >
                            -
                          </button>
                          <span className="qty-number">{item.qty}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => updateCartItemQty(item.cartItemId, 1)}
                            disabled={item.qty >= item.product.stock}
                          >
                            +
                          </button>
                        </div>
                        <strong className="cart-item-total font-emerald">
                          {formatCurrency(item.product.price * item.qty, currency, lang)}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-drawer-total-row">
                  <span>{isAr ? 'المجموع الكلي:' : 'Total Amount:'}</span>
                  <strong className="cart-drawer-total-val font-emerald">
                    {formatCurrency(totalCartAmount, currency, lang)}
                  </strong>
                </div>

                <button
                  type="button"
                  className="btn-whatsapp-order"
                  onClick={handleCheckoutCartWhatsApp}
                >
                  {isAr ? 'إرسال الطلب عبر الواتساب' : 'Checkout & Order via WhatsApp'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicStorefront;
