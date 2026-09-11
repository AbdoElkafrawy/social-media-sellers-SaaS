import { useState, useEffect } from 'react';

function ResetPasswordPage({ onGoToLogin }) {
  const [token, setToken]             = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) {
      setToken(t);
    } else {
      setTokenMissing(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (data.status === 'success') {
        setSuccess(data.message);
        setTimeout(() => onGoToLogin('Password reset successfully! Please log in.'), 2000);
      } else {
        setError(data.message || 'Reset failed.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Strength indicator ──────────────────────────────────────────────────────
  const getStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8)              score++;
    if (/[A-Z]/.test(pwd))            score++;
    if (/[0-9]/.test(pwd))            score++;
    if (/[^A-Za-z0-9]/.test(pwd))    score++;
    const map = [
      { level: 0, label: '',        color: '' },
      { level: 1, label: 'Weak',    color: '#ef4444' },
      { level: 2, label: 'Fair',    color: '#f59e0b' },
      { level: 3, label: 'Good',    color: '#22c55e' },
      { level: 4, label: 'Strong',  color: '#10b981' },
    ];
    return map[score] ?? map[0];
  };
  const strength = getStrength(newPassword);

  // ── Invalid / missing token screen ──────────────────────────────────────────
  if (tokenMissing) {
    return (
      <div className="auth-screen-container">
        <div className="auth-main">
          <div className="card auth-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ marginBottom: '8px' }}>Invalid Reset Link</h2>
            <p className="subtitle" style={{ marginBottom: '24px' }}>
              This link is missing a reset token. Please request a new one from the login page.
            </p>
            <button className="btn btn-primary" onClick={() => onGoToLogin()}>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen-container">
      <header className="auth-header">
        <h1 className="brand-logo">Sales Management Platform</h1>
        <p className="brand-tagline">Set a new password for your seller account</p>
      </header>

      <main className="auth-main">
        <div className="card auth-card">

          {/* Icon + Title */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', fontSize: '24px',
            }}>
              🔐
            </div>
            <h2 style={{ margin: 0 }}>Reset Password</h2>
            <p className="subtitle" style={{ margin: '6px 0 0' }}>
              Choose a strong new password for your account.
            </p>
          </div>

          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {!success && (
            <form onSubmit={handleSubmit} className="auth-form">

              {/* New Password */}
              <div className="form-group">
                <label htmlFor="rp-new-password">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="rp-new-password"
                    type={showNew ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', fontSize: '16px',
                      color: 'var(--text-muted, #94a3b8)', padding: 0,
                    }}
                    title={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? '🙈' : '👁️'}
                  </button>
                </div>

                {/* Strength bar */}
                {newPassword && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{
                      display: 'flex', gap: '4px', marginBottom: '4px',
                    }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{
                          flex: 1, height: '4px', borderRadius: '2px',
                          background: i <= strength.level ? strength.color : 'rgba(255,255,255,0.1)',
                          transition: 'background 0.2s',
                        }} />
                      ))}
                    </div>
                    {strength.label && (
                      <span style={{ fontSize: '11px', color: strength.color, fontWeight: 600 }}>
                        {strength.label}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="rp-confirm-password">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="rp-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    style={{
                      paddingRight: '44px',
                      borderColor: confirm && confirm !== newPassword ? '#ef4444' : undefined,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', fontSize: '16px',
                      color: 'var(--text-muted, #94a3b8)', padding: 0,
                    }}
                  >
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirm && confirm !== newPassword && (
                  <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                    Passwords do not match
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || (confirm && confirm !== newPassword)}
              >
                {loading ? 'Resetting…' : 'Set New Password'}
              </button>
            </form>
          )}

          <div className="auth-footer" style={{ marginTop: '16px', textAlign: 'center' }}>
            <button type="button" className="btn-link" onClick={() => onGoToLogin()}>
              ← Back to Login
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ResetPasswordPage;
