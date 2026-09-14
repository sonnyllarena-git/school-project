import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

// Groups the flat (grade_level, subject, grading_period, final_grade) rows
// into one section per grade level, each with a per-subject average across
// however many quarters were recorded for that grade — a transcript reports
// per-grade-level standing, not per-quarter detail (that's the Report Card).
function groupByGrade(grades) {
  const byGrade = {};
  grades.forEach(g => {
    ((byGrade[g.grade_level] ??= {})[g.subject] ??= []).push(g.final_grade);
  });
  return Object.keys(byGrade)
    .sort((a, b) => a - b)
    .map(gradeLevel => {
      const subjects = Object.entries(byGrade[gradeLevel]).map(([subject, values]) => {
        const present = values.filter(v => v != null);
        const average = present.length ? Math.round((present.reduce((a, b) => a + b, 0) / present.length) * 100) / 100 : null;
        return { subject, average };
      });
      const presentAverages = subjects.map(s => s.average).filter(v => v != null);
      const generalAverage = presentAverages.length
        ? Math.round((presentAverages.reduce((a, b) => a + b, 0) / presentAverages.length) * 100) / 100
        : null;
      return { gradeLevel, subjects, generalAverage };
    });
}

export default function TranscriptOfRecords() {
  const { session } = useAuth();
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTranscript(session.token, studentId).then(setData).catch(err => setError(err.message));
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

  const rows = groupByGrade(data.grades);
  const presentGeneralAverages = rows.map(r => r.generalAverage).filter(v => v != null);
  const cumulativeAverage = presentGeneralAverages.length
    ? Math.round((presentGeneralAverages.reduce((a, b) => a + b, 0) / presentGeneralAverages.length) * 100) / 100
    : null;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 32 }}>
      <div className="no-print" style={{ maxWidth: 700, margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between' }}>
        <Link to="/registrar/documents" style={{ color: 'var(--accent)' }}>&larr; Back</Link>
        <button onClick={() => window.print()}>Print</button>
      </div>

      <div className="certificate">
        <div className="certificate-header">
          <h2>{data.school.name}</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Transcript of Records</div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{data.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>LRN {data.lrn}</div>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 24 }}>No grades recorded yet.</div>
        ) : (
          <>
            {rows.map(r => (
              <div key={r.gradeLevel} style={{ marginTop: 24 }}>
                <h3>Grade {r.gradeLevel}</h3>
                <table>
                  <thead><tr><th>Subject</th><th>Final Grade</th></tr></thead>
                  <tbody>
                    {r.subjects.map(s => (
                      <tr key={s.subject}><td>{s.subject}</td><td>{s.average ?? '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'right', marginTop: 8, fontSize: 14 }}>
                  General Average: <strong>{r.generalAverage ?? '—'}</strong>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, fontSize: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div>Cumulative General Average: <strong>{cumulativeAverage ?? '—'}</strong></div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 64 }}>
          <div>
            <div style={{ borderTop: '1px solid var(--text)', width: 220, paddingTop: 6 }}>{data.school.principal}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>School Principal</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
            Printed: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
