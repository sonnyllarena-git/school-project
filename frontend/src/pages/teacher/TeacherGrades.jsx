import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';
import { cachedFetch } from '../../lib/offlineCache';
import { enqueue } from '../../lib/offlineQueue';

// Must match backend/src/lib/curriculum.js SUBJECTS/GRADING_PERIODS.
const SUBJECTS = ['Filipino', 'English', 'Math', 'Science', 'Values Education'];
const PERIODS = ['First Grading', 'Second Grading', 'Third Grading', 'Fourth Grading'];
const FIELDS = ['first_period_exam', 'second_period_exam', 'third_period_exam', 'formative_score', 'final_grade'];
const FIELD_LABELS = { first_period_exam: '1st Exam', second_period_exam: '2nd Exam', third_period_exam: '3rd Exam', formative_score: 'Formative', final_grade: 'Final' };

export default function TeacherGrades() {
  const { session } = useAuth();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [gradingPeriod, setGradingPeriod] = useState(PERIODS[0]);
  const [roster, setRoster] = useState([]);
  const [scores, setScores] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cachedFetch('teacher_classes', () => api.myClasses(session.token))
      .then(({ data, fromCache }) => {
        setClasses(data);
        if (data[0]) setClassId(data[0].class_id);
        if (fromCache) setNotice('Showing your classes from the last time you were online.');
      })
      .catch(err => setError(err.message));
  }, [session]);

  useEffect(() => {
    if (!classId) return;
    setNotice('');
    cachedFetch(`roster_${classId}`, () => api.classRoster(session.token, classId))
      .then(({ data: students, fromCache }) => {
        setRoster(students);
        if (fromCache) setNotice('Showing this class roster from the last time you were online.');
      })
      .catch(err => setError(err.message));
  }, [classId, session]);

  // Pre-fill whatever's already on file for this subject/period so reopening
  // it (e.g. to bump a final grade after a student retakes an exam) shows the
  // existing scores instead of blank inputs — saving is a full-row overwrite,
  // so blank fields left untouched here would otherwise wipe them.
  useEffect(() => {
    if (!classId || roster.length === 0) return;
    const blank = {};
    roster.forEach(s => { blank[s.student_id] = {}; });
    setScores(blank);
    api.getClassGrades(session.token, classId, subject, gradingPeriod)
      .then(existing => {
        setScores(prev => {
          const next = { ...prev };
          existing.forEach(g => {
            next[g.student_id] = {};
            FIELDS.forEach(f => { if (g[f] !== null && g[f] !== undefined) next[g.student_id][f] = g[f]; });
          });
          return next;
        });
      })
      .catch(err => setError(err.message));
  }, [classId, subject, gradingPeriod, roster, session]);

  function setScore(studentId, field, value) {
    setScores(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  }

  async function handleSave() {
    setError('');
    setNotice('');
    setSaving(true);
    const records = roster.map(s => {
      const row = scores[s.student_id] || {};
      const record = { student_id: s.student_id };
      FIELDS.forEach(f => { if (row[f] !== undefined && row[f] !== '') record[f] = Number(row[f]); });
      return record;
    });
    try {
      if (!navigator.onLine) throw new Error('offline');
      await api.enterGrades(session.token, classId, subject, gradingPeriod, records);
      setNotice(`Grades saved for ${subject} — ${gradingPeriod}.`);
    } catch {
      enqueue({ kind: 'grades', token: session.token, classId, subject, gradingPeriod, records });
      setNotice(`You're offline — grades for ${subject} — ${gradingPeriod} are queued and will sync automatically.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="Grade Entry">
      <div className="card">
        <div className="form-row">
          <div>
            <label>Class</label>
            <select value={classId} onChange={e => setClassId(e.target.value)}>
              {classes.map(c => (
                <option key={c.class_id} value={c.class_id}>Grade {c.grade_level}{c.section} — Room {c.room}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Grading Period</label>
            <select value={gradingPeriod} onChange={e => setGradingPeriod(e.target.value)}>
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {notice && <div className="error-banner" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>{notice}</div>}

        {roster.length === 0 ? (
          <div className="empty-state">No students in this class.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  {FIELDS.map(f => <th key={f}>{FIELD_LABELS[f]}</th>)}
                </tr>
              </thead>
              <tbody>
                {roster.map(s => (
                  <tr key={s.student_id}>
                    <td>{s.name}</td>
                    {FIELDS.map(f => (
                      <td key={f}>
                        <input
                          type="number" min="0" max="100" style={{ width: 70 }}
                          value={scores[s.student_id]?.[f] ?? ''}
                          onChange={e => setScore(s.student_id, f, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {roster.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Grades'}</button>
          </div>
        )}
      </div>
    </Layout>
  );
}
