import { useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../lib/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TABLES = ['students', 'teachers', 'attendance', 'grades', 'payments', 'fee_items'];

export default function AdminExport() {
  const { session } = useAuth();
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);

  async function handleExport(table) {
    setError('');
    setDownloading(table);
    try {
      const res = await fetch(`${BASE_URL}/admin/export/${table}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <Layout title="Data Export">
      <div className="card">
        <h3>Export Full Dataset (CSV)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
          Plain CSV, no proprietary format or encryption — safe to hand to another system.
        </p>
        {error && <div className="error-banner">{error}</div>}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {TABLES.map(t => (
            <button key={t} className="secondary" disabled={downloading === t} onClick={() => handleExport(t)}>
              {downloading === t ? 'Downloading…' : `Export ${t}.csv`}
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
