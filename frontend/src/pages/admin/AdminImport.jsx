import { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

const SAMPLE = `lrn,name,date_of_birth,gender,class_id
123151,Juan Dela Cruz,2019-03-14,M,CLS001`;

export default function AdminImport() {
  const { session } = useAuth();
  const [csv, setCsv] = useState(SAMPLE);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleImport(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api.importStudents(session.token, csv);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3>Paste CSV</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
        Columns: <code>lrn,name,date_of_birth,gender,class_id</code>. Re-importing the same LRN updates that student instead of duplicating.
      </p>
      {error && <div className="error-banner">{error}</div>}
      {result && (
        <div className="error-banner" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
          Imported: {result.inserted} new, {result.updated} updated ({result.total} total rows)
        </div>
      )}
      <form onSubmit={handleImport}>
        <textarea
          value={csv} onChange={e => setCsv(e.target.value)} rows={10}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}
        />
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>{loading ? 'Importing…' : 'Import'}</button>
        </div>
      </form>
    </div>
  );
}
