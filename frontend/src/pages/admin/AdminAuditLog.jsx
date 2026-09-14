import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

export default function AdminAuditLog() {
  const { session } = useAuth();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAuditLogs(session.token).then(setLogs).catch(err => setError(err.message));
  }, [session]);

  return (
    <Layout title="Audit Log">
      <div className="card">
        <h3>Recent Activity ({logs.length})</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
          Who did what, when — most recent 200 events. Required by CLAUDE.md §1.1 (audit logs for all data access).
        </p>
        {error && <div className="error-banner">{error}</div>}
        {logs.length === 0 ? (
          <div className="empty-state">No activity recorded yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Timestamp</th><th>User</th><th>Role</th><th>Action</th><th>Table</th><th>Records</th><th>Status</th></tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.audit_id}>
                    <td>{new Date(l.timestamp).toLocaleString()}</td>
                    <td>{l.user_name || '—'}</td>
                    <td>{l.user_role || '—'}</td>
                    <td>{l.action}</td>
                    <td>{l.table_affected}</td>
                    <td>{l.record_count ?? '—'}</td>
                    <td>
                      <span className={`pill ${l.status === 'SUCCESS' ? 'success' : 'danger'}`}>{l.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
