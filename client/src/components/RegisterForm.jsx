import { useState } from 'react';
import { translations } from '../utils/i18n';

function RegisterForm({ onRegisterSuccess, switchToLogin, lang }) {
  const t = translations[lang] || translations.en;

  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!storeName.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال اسم المتجر' : 'Please enter your Social Media Store Name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError(lang === 'ar' ? 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل' : 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName, email, password, currency }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        localStorage.setItem('sellerToken', data.token);
        onRegisterSuccess(data.user, data.token);
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <h2>{t.registerTitle}</h2>
      <p className="subtitle">{t.registerSubtitle}</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="storeName">{t.storeNameLabel}</label>
          <input
            id="storeName"
            type="text"
            placeholder={lang === 'ar' ? 'مثال: متجر بيلا فاشون' : 'e.g. Bella Chic Vintage'}
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">{t.emailLabel}</label>
          <input
            id="email"
            type="email"
            placeholder="seller@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="password">{t.passwordLabel}</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="currency">{t.currencyLabel}</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="styled-select"
            >
              <option value="EGP">🇪🇬 EGP (ج.م)</option>
              <option value="USD">💵 USD ($)</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t.registering : t.registerBtn}
        </button>
      </form>

      <div className="auth-footer">
        {t.alreadyAccount}{' '}
        <button type="button" className="btn-link" onClick={switchToLogin}>
          {t.loginHere}
        </button>
      </div>
    </div>
  );
}

export default RegisterForm;
