import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const HOME_BY_ROLE = {
  ADMIN: '/admin',
  TEACHER: '/teacher/attendance',
  STUDENT: '/student',
  PARENT: '/parent',
};

export default function Login() {
  const { login } = useAuth();
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
        <h1>St. Michael's Academy</h1>
        <p className="subtitle">School Portal Login</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email" type="email" value={email} required
            onChange={e => setEmail(e.target.value)}
            placeholder="you@stmichaels.ph"
            style={{ width: '100%', marginBottom: 14 }}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password" type="password" value={password} required
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: '100%' }}
          />
          <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Log In'}</button>
        </form>
        <div className="demo-creds">
          Demo accounts: <code>admin@stmichaels.ph / Admin@2025</code>,{' '}
          <code>teacher.1@stmichaels.ph / Teacher@1</code>,{' '}
          <code>student.123001@stmichaels.ph / Student@123001</code>,{' '}
          <code>parent.1@stmichaels.ph / Parent@1</code>
        </div>
      </div>
    </div>
  );
}
