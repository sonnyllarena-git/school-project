import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import ScheduleView from '../../components/ScheduleView';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

const GRADES = [1, 2, 3, 4, 5, 6];

export default function AdminSchedules() {
  const { session } = useAuth();
  const [grade, setGrade] = useState(1);
  const [section, setSection] = useState('');
  const [gradeData, setGradeData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSubjects(session.token).then(setGradeData).catch(err => setError(err.message));
  }, [session]);

  const sectionsForGrade = gradeData.find(g => g.grade_level === grade)?.sections || [];

  useEffect(() => {
    if (sectionsForGrade.length > 0 && !sectionsForGrade.some(s => s.section === section)) {
      setSection(sectionsForGrade[0].section);
    }
  }, [grade, gradeData]);

  const sectionEntry = sectionsForGrade.find(s => s.section === section);
  const schedule = sectionEntry ? {
    grade_level: grade,
    section,
    subjects: sectionEntry.subjects.map(s => ({
      code: s.code, name: s.name, schedule: s.schedule, teachers: s.teachers.map(t => t.name),
    })),
  } : null;

  return (
    <Layout title="Schedules">
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Schedules by Grade & Section</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
          Read-only view of every class's weekly schedule. Manage subjects and teacher assignments on the Subjects tab.
        </p>
        {error && <div className="error-banner">{error}</div>}
        <div className="form-row">
          <div style={{ maxWidth: 160 }}>
            <label>Grade</label>
            <select value={grade} onChange={e => setGrade(Number(e.target.value))}>
              {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
        </div>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {sectionsForGrade.map(s => (
            <button key={s.section} className={s.section === section ? 'active' : ''} onClick={() => setSection(s.section)}>
              Section {s.section}
            </button>
          ))}
        </div>
      </div>

      <ScheduleView schedule={schedule} />
    </Layout>
  );
}
