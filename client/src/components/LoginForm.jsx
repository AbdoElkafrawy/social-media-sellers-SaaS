import { useState } from 'react';
import { translations } from '../utils/i18n';

function LoginForm({ onLoginSuccess, switchToRegister, lang, successMsg, onSuccessMsgRead }) {
  const t = translations[lang] || translations.en;
  const isAr = lang === 'ar';

  // ── Login state ─────────────────────────────────────────────────────────────
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // ── Forgot password state ────────────────────────────────────────────────────
  const [view, setView]               = useState('login'); // 'login' | 'forgot'
  const [fpEmail, setFpEmail]         = useState('');
  const [fpLoading, setFpLoading]     = useState(false);
  const [fpError, setFpError]         = useState('');
  const [fpSuccess, setFpSuccess]     = useState('');

  // ── Login submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(isAr ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email address.');
      return;
    }
    if (!password) {
      setError(isAr ? 'يرجى إدخال كلمة المرور' : 'Please enter your password.');
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
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password submit ────────────────────────────────────────────────────
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setFpError('');
    setFpSuccess('');

    if (!fpEmail.trim()) {
      setFpError(isAr ? 'يرجى إدخال بريدك الإلكتروني' : 'Please enter your email address.');
      return;
    }

    setFpLoading(true);
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();

      if (data.status === 'success') {
        setFpSuccess(
          isAr
            ? 'إذا كان البريد الإلكتروني مسجلاً، ستصل رسالة إعادة تعيين كلمة المرور خلال دقائق.'
            : 'If that email is registered, a reset link will arrive in your inbox shortly.'
        );
      } else {
        setFpError(data.message || 'Something went wrong.');
      }
    } catch {
      setFpError('Network error. Please try again.');
    } finally {
      setFpLoading(false);
    }
  };

  // ── FORGOT PASSWORD PANEL ────────────────────────────────────────────────────
  if (view === 'forgot') {
    return (
      <div className="card auth-card">
        {/* Back arrow */}
        <button
          type="button"
          className="btn-link"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontSize: '13px' }}
          onClick={() => { setView('login'); setFpEmail(''); setFpError(''); setFpSuccess(''); }}
        >
          ← {isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
        </button>

        {/* Icon + heading */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: '22px',
          }}>
            📧
          </div>
          <h2 style={{ margin: 0, fontSize: '20px' }}>
            {isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
          </h2>
          <p className="subtitle" style={{ margin: '6px 0 0', fontSize: '13px' }}>
            {isAr
              ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين'
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {fpError   && <div className="alert alert-error">{fpError}</div>}
        {fpSuccess && <div className="alert alert-success">{fpSuccess}</div>}

        {!fpSuccess && (
          <form onSubmit={handleForgotSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fp-email">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
              <input
                id="fp-email"
                type="email"
                placeholder="seller@example.com"
                value={fpEmail}
                onChange={(e) => setFpEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={fpLoading}>
              {fpLoading
                ? (isAr ? 'جاري الإرسال…' : 'Sending…')
                : (isAr ? 'إرسال رابط الاسترداد' : 'Send Reset Link')}
            </button>
          </form>
        )}

        {fpSuccess && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '8px', width: '100%' }}
            onClick={() => { setView('login'); setFpEmail(''); setFpSuccess(''); }}
          >
            {isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
          </button>
        )}
      </div>
    );
  }

  // ── LOGIN FORM ───────────────────────────────────────────────────────────────
  return (
    <div className="card auth-card">
      <h2>{t.loginTitle}</h2>
      <p className="subtitle">{t.loginSubtitle}</p>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '12px' }}>
          {successMsg}
          <button
            type="button"
            onClick={onSuccessMsgRead}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
          >✕</button>
        </div>
      )}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label htmlFor="loginPassword" style={{ margin: 0 }}>{t.passwordLabel}</label>
            <button
              type="button"
              className="btn-link"
              style={{ fontSize: '12px' }}
              onClick={() => { setView('forgot'); setFpEmail(email); }}
            >
              {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              id="loginPassword"
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: '44px' }}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)', background: 'none',
                border: 'none', cursor: 'pointer', fontSize: '16px',
                color: 'var(--text-muted, #94a3b8)', padding: 0,
              }}
              title={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? '🙈' : '👁️'}
            </button>
          </div>
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
