import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

const today = () => new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

export default function GoodMoralCertificate() {
  const { session } = useAuth();
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getGoodMoral(session.token, studentId).then(setData).catch(err => setError(err.message));
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

        <h1 style={{ textAlign: 'center', margin: '32px 0 8px' }}>Certificate of Good Moral Character</h1>

        <p style={{ marginTop: 32, lineHeight: 1.8 }}>
          This is to certify that <strong>{data.name}</strong> (LRN: {data.lrn}), {data.gender === 'M' ? 'a male' : 'a female'} pupil
          currently enrolled in <strong>Grade {data.grade_level} — {data.section}</strong> at {data.school.name},
          has shown satisfactory conduct and has not been involved in any disciplinary case during their stay in this institution.
        </p>

        <p style={{ marginTop: 16, lineHeight: 1.8 }}>
          This certification is issued upon the request of the above-named pupil/guardian for whatever legal purpose it may serve.
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
