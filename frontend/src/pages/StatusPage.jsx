import { useEffect, useState } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function StatusPage() {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    function poll() {
      fetch(`${BASE_URL}/status`).then(r => r.json()).then(setStatus).catch(() => setError('Unable to reach the status service.'));
      fetch(`${BASE_URL}/status/history`).then(r => r.json()).then(setHistory).catch(() => {});
    }
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, []);

  const operational = status?.status === 'operational';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '48px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 4 }}>St. Michael's Academy — System Status</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>Public status page — no login required.</p>

        {error && <div className="error-banner">{error}</div>}

        {status && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span className={`pill ${operational ? 'success' : 'danger'}`} style={{ fontSize: 14, padding: '6px 14px' }}>
                {operational ? '● All Systems Operational' : '● Degraded'}
              </span>
            </div>
            <div className="grid grid-3">
              <div className="stat-card">
                <div className="value">{status.uptime_pct_recent ?? '—'}%</div>
                <div className="label">Uptime (recent checks)</div>
              </div>
              <div className="stat-card">
                <div className="value">{status.db_connected ? 'Connected' : 'Down'}</div>
                <div className="label">Database</div>
              </div>
              <div className="stat-card">
                <div className="value">{new Date(status.started_at).toLocaleString()}</div>
                <div className="label">Server Started</div>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <h3>Recent Checks</h3>
          {history.length === 0 ? (
            <div className="empty-state">No history yet.</div>
          ) : (
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {history.map((h, i) => (
                <div
                  key={i}
                  title={`${h.timestamp} — ${h.ok ? 'OK' : 'Down'}`}
                  style={{ width: 8, height: 24, borderRadius: 2, background: h.ok ? 'var(--success)' : 'var(--danger)' }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
