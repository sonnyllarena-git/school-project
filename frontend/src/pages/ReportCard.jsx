import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

// Must match backend/src/lib/curriculum.js GRADING_PERIODS/PASSING_GRADE.
const GRADING_PERIODS = ['First Grading', 'Second Grading', 'Third Grading', 'Fourth Grading'];
const PERIOD_LABELS = ['Q1', 'Q2', 'Q3', 'Q4'];
const PASSING_GRADE = 75;

// Pivots flat (subject, grading_period, final_grade) rows into one row per
// subject with a column per quarter, plus a general average across whichever
// quarters have been recorded.
function pivot(grades) {
  const bySubject = {};
  grades.forEach(g => {
    (bySubject[g.subject] ??= {})[g.grading_period] = g.final_grade;
  });
  return Object.entries(bySubject).map(([subject, periods]) => {
    const values = GRADING_PERIODS.map(p => (periods[p] != null ? Number(periods[p]) : null));
    const present = values.filter(v => v != null);
    const average = present.length ? Math.round((present.reduce((a, b) => a + b, 0) / present.length) * 100) / 100 : null;
    return { subject, values, average };
  });
}

export default function ReportCard({ source }) {
  const { session } = useAuth();
  const { studentId } = useParams();
  const [grades, setGrades] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = source === 'admin'
      ? Promise.all([api.getStudentGrades(session.token, studentId), api.getAccount(session.token, studentId)])
          .then(([g, acc]) => ({ grades: g, identity: { name: acc.name, lrn: acc.lrn, grade_level: acc.grade_level, section: acc.section, adviser_name: acc.adviser_name, school_year: acc.school_year } }))
      : Promise.all([api.myGrades(session.token), api.myAccount(session.token)])
          .then(([g, acc]) => ({ grades: g, identity: { name: session.user.name, lrn: null, grade_level: acc.grade_level, section: acc.section, adviser_name: acc.adviser_name, school_year: acc.school_year } }));

    load.then(({ grades, identity }) => { setGrades(grades); setIdentity(identity); }).catch(err => setError(err.message));
  }, [session, source, studentId]);

  const backLink = source === 'admin' ? '/admin/students' : '/student';

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <div className="error-banner">{error}</div>
        <Link to={backLink}>&larr; Back</Link>
      </div>
    );
  }
  if (!grades || !identity) return <div style={{ padding: 40 }} className="empty-state">Loading…</div>;

  const rows = pivot(grades);
  const overallAverage = rows.length
    ? Math.round((rows.reduce((sum, r) => sum + (r.average ?? 0), 0) / rows.length) * 100) / 100
    : null;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 32 }}>
      <div className="no-print" style={{ maxWidth: 700, margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between' }}>
        <Link to={backLink} style={{ color: 'var(--accent)' }}>&larr; Back</Link>
        <button onClick={() => window.print()}>Print</button>
      </div>

      <div className="certificate">
        <div className="certificate-header">
          <h2>St. Michael's Academy</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Report Card — School Year {identity.school_year}</div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{identity.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {identity.lrn ? `LRN ${identity.lrn} · ` : ''}Grade {identity.grade_level} — {identity.section}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Adviser: {identity.adviser_name || '—'}</div>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 24 }}>No grades recorded yet.</div>
        ) : (
          <>
            <table style={{ marginTop: 24 }}>
              <thead>
                <tr>
                  <th>Subject</th>
                  {PERIOD_LABELS.map(p => <th key={p}>{p}</th>)}
                  <th>Average</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.subject}>
                    <td>{r.subject}</td>
                    {r.values.map((v, i) => <td key={i}>{v ?? '—'}</td>)}
                    <td><strong>{r.average ?? '—'}</strong></td>
                    <td>{r.average != null ? (r.average >= PASSING_GRADE ? 'Passed' : 'Failed') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, fontSize: 15 }}>
              <div>General Average: <strong>{overallAverage ?? '—'}</strong></div>
            </div>
          </>
        )}

        <div style={{ marginTop: 64, textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
          Printed: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
