import ProductManager from './ProductManager';
import { translations } from '../utils/i18n';

function Dashboard({ user, onLogout, lang, onLangChange, onCurrencyChange, onPreviewStorefront, onNavigateEdit }) {
  const t = translations[lang] || translations.en;
  const isAr = lang === 'ar';

  return (
    <div className="dashboard-shell">
      {/* TOP NAVIGATION BAR */}
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <div>
              <h1 className="brand-title">{user.storeName}</h1>
              <span className="brand-subtitle">{t.brandSubtitle}</span>
            </div>
          </div>

          <div className="navbar-actions">
            {/* View Public Storefront Button */}
            <button
              type="button"
              className="btn-store-preview"
              onClick={() => onPreviewStorefront && onPreviewStorefront(user.id)}
              title={isAr ? 'معاينة متجر المشترين وتجربة طلبات الواتساب' : 'Preview public storefront and WhatsApp ordering'}
            >
              {isAr ? 'عرض متجر المشترين' : 'View Public Store'}
            </button>

            {/* Currency Selector */}
            <div className="selector-group">
              <select
                value={user.currency || 'EGP'}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="nav-select"
              >
                <option value="EGP">EGP (ج.م)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            {/* Language Switcher Toggle */}
            <div className="selector-group">
              <select
                value={lang}
                onChange={(e) => onLangChange(e.target.value)}
                className="nav-select"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            <div className="user-profile-badge">
              <span className="status-indicator-dot"></span>
              <span className="user-email">{user.email}</span>
            </div>

            <button type="button" className="btn-logout" onClick={onLogout}>
              {t.logoutBtn}
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD BODY */}
      <main className="dashboard-body">
        <ProductManager
          user={user}
          lang={lang}
          onCurrencyChange={onCurrencyChange}
          onNavigateEdit={onNavigateEdit}
        />
      </main>
    </div>
  );
}

export default Dashboard;
