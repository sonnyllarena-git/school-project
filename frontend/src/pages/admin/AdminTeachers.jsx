import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

// Groups a teacher's {subject, grade_level} assignments into one line per
// grade, e.g. "Grade 1: Filipino, Math · Grade 4: Science" — read-only here;
// assignments are made on the Subjects tab (per grade/subject, since one
// subject in one grade can have more than one teacher).
function formatSubjects(subjects) {
  if (!subjects.length) return '—';
  const byGrade = {};
  subjects.forEach(({ subject, grade_level }) => {
    (byGrade[grade_level] ??= []).push(subject);
  });
  return Object.keys(byGrade)
    .sort((a, b) => a - b)
    .map(g => `Grade ${g}: ${byGrade[g].join(', ')}`)
    .join(' · ');
}

export default function AdminTeachers() {
  const { session } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listTeachers(session.token).then(setTeachers).catch(err => setError(err.message));
  }, [session]);

  return (
    <Layout title="Teachers">
      <div className="card">
        <h3>All Teachers ({teachers.length})</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
          Subject assignments are managed on the Subjects tab (per grade — one subject can have more than one teacher).
          New teacher accounts and password resets are on the User Management tab.
        </p>
        {error && <div className="error-banner">{error}</div>}
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Advises</th><th>Subjects</th></tr></thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.teacher_id}>
                <td>{t.name}</td>
                <td>{t.email}</td>
                <td>{t.advises_grade ? `Grade ${t.advises_grade} — ${t.advises_section}` : '—'}</td>
                <td>{formatSubjects(t.subjects)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
