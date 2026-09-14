import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

const today = () => new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

export default function HonorableDismissal() {
  const { session } = useAuth();
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getHonorableDismissal(session.token, studentId).then(setData).catch(err => setError(err.message));
  }, [session, studentId]);

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <div className="error-banner">{error}</div>
        <Link to="/registrar/documents">&larr; Back</Link>
      </div>
    );
  }
  if (!data) return <div style={{ padding: 40 }} className="empty-state">Loading…</div>;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 32 }}>
      <div className="no-print" style={{ maxWidth: 700, margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between' }}>
        <Link to="/registrar/documents" style={{ color: 'var(--accent)' }}>&larr; Back</Link>
        <button onClick={() => window.print()}>Print</button>
      </div>

      <div className="certificate">
        <div className="certificate-header">
          <h2>{data.school.name}</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>DepEd Institution ID: {data.school.deped_id}</div>
        </div>

        <h1 style={{ textAlign: 'center', margin: '32px 0 8px' }}>Honorable Dismissal</h1>

        <p style={{ marginTop: 32, lineHeight: 1.8 }}>
          This is to certify that <strong>{data.name}</strong> (LRN: {data.lrn}) was enrolled in <strong>Grade {data.grade_level} — {data.section}</strong> at
          {' '}{data.school.name} and is honorably dismissed from this institution, being cleared of all financial and academic obligations as of the date below.
        </p>

        <p style={{ marginTop: 16, lineHeight: 1.8 }}>
          This document is issued to facilitate transfer to another school and to serve whatever legal purpose it may be needed for.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 64 }}>
          <div>
            <div style={{ borderTop: '1px solid var(--text)', width: 220, paddingTop: 6 }}>{data.school.principal}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>School Principal</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
            Issued: {today()}
          </div>
        </div>
      </div>
    </div>
  );
}
