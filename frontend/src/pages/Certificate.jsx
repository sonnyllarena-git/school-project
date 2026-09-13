import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

export default function Certificate({ source }) {
  const { session } = useAuth();
  const { studentId } = useParams();
  const [cert, setCert] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetcher = source === 'admin' ? api.getCertificate(session.token, studentId) : api.myCertificate(session.token);
    fetcher.then(setCert).catch(err => setError(err.message));
  }, [session, source, studentId]);

  const backLink = source === 'admin' ? '/admin/enrollment' : '/student/enrollment';

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <div className="error-banner">{error}</div>
        <Link to={backLink}>&larr; Back</Link>
      </div>
    );
  }
  if (!cert) return <div style={{ padding: 40 }} className="empty-state">Loading…</div>;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 32 }}>
      <div className="no-print" style={{ maxWidth: 700, margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between' }}>
        <Link to={backLink} style={{ color: 'var(--accent)' }}>&larr; Back</Link>
        <button onClick={() => window.print()}>Print</button>
      </div>

      <div className="certificate">
        <div className="certificate-header">
          <h2>{cert.school.name}</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>DepEd Institution ID: {cert.school.deped_id}</div>
        </div>

        <h1 style={{ textAlign: 'center', margin: '32px 0 8px' }}>Certificate of Matriculation</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>School Year {cert.school_year}</p>

        <p style={{ marginTop: 32, lineHeight: 1.8 }}>
          This is to certify that <strong>{cert.student_name}</strong> (LRN: {cert.lrn}) is officially enrolled
          as a student of <strong>Grade {cert.grade_level}{cert.section}</strong> for School Year {cert.school_year},
          having completed the enrollment requirements including full settlement of assessed fees.
        </p>

        <h3 style={{ marginTop: 32 }}>Enrolled Subjects</h3>
        <ul>
          {cert.subjects.map(s => <li key={s}>{s}</li>)}
        </ul>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 64 }}>
          <div>
            <div style={{ borderTop: '1px solid var(--text)', width: 220, paddingTop: 6 }}>{cert.school.principal}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>School Principal</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
            Issued: {new Date(cert.issued_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
