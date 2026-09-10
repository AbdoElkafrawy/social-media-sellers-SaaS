import { useState } from 'react';
import { translations } from '../utils/i18n';

function LoginForm({ onLoginSuccess, switchToRegister, lang }) {
  const t = translations[lang] || translations.en;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email address.');
      return;
    }
    if (!password) {
      setError(lang === 'ar' ? 'يرجى إدخال كلمة المرور' : 'Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        localStorage.setItem('sellerToken', data.token);
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <h2>{t.loginTitle}</h2>
      <p className="subtitle">{t.loginSubtitle}</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="loginEmail">{t.emailLabel}</label>
          <input
            id="loginEmail"
            type="email"
            placeholder="seller@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="loginPassword">{t.passwordLabel}</label>
          <input
            id="loginPassword"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t.loggingIn : t.loginBtn}
        </button>
      </form>

      <div className="auth-footer">
        {t.noAccount}{' '}
        <button type="button" className="btn-link" onClick={switchToRegister}>
          {t.registerHere}
        </button>
      </div>
    </div>
  );
}

export default LoginForm;
