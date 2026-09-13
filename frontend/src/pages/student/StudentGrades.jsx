import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

export default function StudentGrades() {
  const { session } = useAuth();
  const [grades, setGrades] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.myGrades(session.token).then(setGrades).catch(err => setError(err.message));
  }, [session]);

  if (error) return <Layout title="My Grades"><div className="error-banner">{error}</div></Layout>;
  if (!grades) return <Layout title="My Grades"><div className="empty-state">Loading…</div></Layout>;

  const average = grades.length
    ? Math.round((grades.reduce((s, g) => s + Number(g.final_grade || 0), 0) / grades.length) * 100) / 100
    : null;

  const byPeriod = grades.reduce((acc, g) => {
    (acc[g.grading_period] ||= []).push(g);
    return acc;
  }, {});

  return (
    <Layout title="My Grades">
      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <StatCard label="Subjects Graded" value={grades.length} />
        <StatCard label="Overall Average" value={average ?? '—'} />
        <StatCard label="Grading Periods" value={Object.keys(byPeriod).length} />
      </div>

      {grades.length === 0 ? (
        <div className="card"><div className="empty-state">No grades recorded yet.</div></div>
      ) : (
        Object.entries(byPeriod).map(([period, rows]) => (
          <div className="card" key={period} style={{ marginBottom: 16 }}>
            <h3>{period}</h3>
            <table>
              <thead><tr><th>Subject</th><th>1st Exam</th><th>2nd Exam</th><th>3rd Exam</th><th>Formative</th><th>Final</th></tr></thead>
              <tbody>
                {rows.map(g => (
                  <tr key={g.subject}>
                    <td>{g.subject}</td>
                    <td>{g.first_period_exam}</td>
                    <td>{g.second_period_exam}</td>
                    <td>{g.third_period_exam}</td>
                    <td>{g.formative_score}</td>
                    <td><strong>{g.final_grade}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </Layout>
  );
}
