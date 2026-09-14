import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import GradesView from '../../components/GradesView';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

export default function StudentGrades() {
  const { session } = useAuth();
  const navigate = useNavigate();
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

  const periodCount = new Set(grades.map(g => g.grading_period)).size;

  return (
    <Layout title="My Grades">
      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <StatCard label="Subjects Graded" value={grades.length} />
        <StatCard label="Overall Average" value={average ?? '—'} />
        <StatCard label="Grading Periods" value={periodCount} />
      </div>

      {grades.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button className="secondary" onClick={() => navigate('/student/report-card')}>Print Report Card</button>
        </div>
      )}

      <GradesView grades={grades} />
    </Layout>
  );
}
