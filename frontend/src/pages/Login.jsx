import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/i18n';
import Footer from '../components/Footer';

const HOME_BY_ROLE = {
  ADMIN: '/admin',
  REGISTRAR: '/registrar',
  CASHIER: '/cashier',
  TEACHER: '/teacher/attendance',
  STUDENT: '/student',
};

export default function Login() {
  const { login } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(HOME_BY_ROLE[user.role] || '/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginBottom: 8 }}>
          <button className={lang === 'en' ? 'secondary' : 'ghost'} style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => setLang('en')}>EN</button>
          <button className={lang === 'tl' ? 'secondary' : 'ghost'} style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => setLang('tl')}>TL</button>
        </div>
        <h1>St. Michael's Academy</h1>
        <p className="subtitle">{t('school_portal_login')}</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">{t('email')}</label>
          <input
            id="email" type="email" value={email} required
            onChange={e => setEmail(e.target.value)}
            placeholder="you@stmichaels.ph"
            style={{ width: '100%', marginBottom: 14 }}
          />
          <label htmlFor="password">{t('password')}</label>
          <input
            id="password" type="password" value={password} required
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: '100%' }}
          />
          <button type="submit" disabled={loading}>{loading ? t('signing_in') : t('log_in')}</button>
        </form>
        <div className="demo-creds">
          Demo accounts: <code>admin@stmichaels.ph / Admin@2025</code>,{' '}
          <code>registrar@stmichaels.ph / Registrar@2025</code>,{' '}
          <code>cashier@stmichaels.ph / Cashier@2025</code>,{' '}
          <code>teacher.1@stmichaels.ph / Teacher@1</code>,{' '}
          <code>student.123001@stmichaels.ph / Student@123001</code>{' '}
          (a parent uses this same student login — no separate Parent account)
        </div>
      </div>
      <Footer />
    </div>
  );
}
