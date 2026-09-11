import { useState, useEffect } from 'react';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import PublicStorefront from './components/PublicStorefront';
import EditProductPage from './components/EditProductPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [lang, setLang] = useState(localStorage.getItem('appLang') || 'en');
  const [viewStoreId, setViewStoreId] = useState(null);
  const [editProductId, setEditProductId] = useState(null);
  const [resetToken, setResetToken] = useState(null); // present when /reset-password?token=...
  const [authSuccessMsg, setAuthSuccessMsg] = useState(''); // passed back from ResetPasswordPage

  // Check URL for ?store=ID or ?token= (reset password link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storeParam = params.get('store');
    const tokenParam = params.get('token');
    // Detect /reset-password path OR bare ?token= on any path
    if (window.location.pathname.includes('reset-password') || tokenParam) {
      setResetToken(tokenParam || '');
    } else if (storeParam) {
      setViewStoreId(storeParam);
    }
  }, []);

  // Keep the browser URL in sync with the viewed store
  useEffect(() => {
    if (viewStoreId) {
      const url = new URL(window.location);
      url.searchParams.set('store', viewStoreId);
      window.history.replaceState({}, '', url.toString());
    }
  }, [viewStoreId]);

  // Handle Language & RTL / LTR HTML Attribute
  useEffect(() => {
    localStorage.setItem('appLang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Check if seller is already logged in on page load
  useEffect(() => {
    const token = localStorage.getItem('sellerToken');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'success') {
            setCurrentUser(data.user);
          } else {
            localStorage.removeItem('sellerToken');
          }
        })
        .catch(() => {
          localStorage.removeItem('sellerToken');
        })
        .finally(() => setLoadingAuth(false));
    } else {
      setLoadingAuth(false);
    }
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('sellerToken');
    setCurrentUser(null);
    setAuthView('login');
  };

  // Update Currency on Backend & Frontend
  const handleCurrencyChange = async (newCurrency) => {
    if (!currentUser) return;
    setCurrentUser((prev) => ({ ...prev, currency: newCurrency }));

    const token = localStorage.getItem('sellerToken');
    try {
      await fetch('/api/auth/currency', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currency: newCurrency }),
      });
    } catch (err) {
      console.error('Failed to update currency:', err);
    }
  };

  if (loadingAuth) {
    return (
      <div className="full-screen-center">
        <div className="spinner"></div>
        <p className="status-loading">Verifying authentication session...</p>
      </div>
    );
  }

  // 0. Password reset page (arrived via email link)
  if (resetToken !== null) {
    return (
      <ResetPasswordPage
        onGoToLogin={(msg) => {
          setResetToken(null);
          setAuthView('login');
          if (msg) setAuthSuccessMsg(msg);
          // Clean the URL without a full reload
          window.history.replaceState({}, '', '/');
        }}
      />
    );
  }

  // 1. If viewing a public storefront
  if (viewStoreId) {
    return (
      <PublicStorefront
        storeId={viewStoreId}
        backToDashboard={currentUser ? () => {
          setViewStoreId(null);
          window.history.replaceState({}, '', '/');
        } : null}
      />
    );
  }

  // 1.5 If Logged In & Editing a product on dedicated page
  if (currentUser && editProductId) {
    return (
      <EditProductPage
        productId={editProductId}
        user={currentUser}
        lang={lang}
        onBack={() => setEditProductId(null)}
        onSaveSuccess={() => {}}
        onCurrencyChange={handleCurrencyChange}
        onLangChange={setLang}
      />
    );
  }

  // 2. If Logged In, Render Full Workspace Dashboard
  if (currentUser) {
    return (
      <Dashboard
        user={currentUser}
        onLogout={handleLogout}
        lang={lang}
        onLangChange={setLang}
        onCurrencyChange={handleCurrencyChange}
        onPreviewStorefront={(id) => setViewStoreId(id)}
        onNavigateEdit={(id) => setEditProductId(id)}
      />
    );
  }

  // 3. Otherwise, Render Auth Screens (Login / Register)
  return (
    <div className="auth-screen-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
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
      </div>

      <header className="auth-header">
        <h1 className="brand-logo">
          {lang === 'ar' ? 'منصة إدارة المبيعات' : 'Sales Management Platform'}
        </h1>
        <p className="brand-tagline">
          {lang === 'ar'
            ? 'حوّل متابعيك على فيسبوك وإنستغرام وتيك توك وواتساب إلى طلبات فورية'
            : 'Turn your facebook, Instagram, TikTok & WhatsApp buyers into instant orders'}
        </p>
      </header>

      <main className="auth-main">
        {authView === 'login' ? (
          <LoginForm
            onLoginSuccess={handleAuthSuccess}
            switchToRegister={() => setAuthView('register')}
            lang={lang}
            successMsg={authSuccessMsg}
            onSuccessMsgRead={() => setAuthSuccessMsg('')}
          />
        ) : (
          <RegisterForm
            onRegisterSuccess={handleAuthSuccess}
            switchToLogin={() => setAuthView('login')}
            lang={lang}
          />
        )}
      </main>

      <footer className="auth-footer">
        <p>&copy; {new Date().getFullYear()} Social Media Sellers SaaS. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
