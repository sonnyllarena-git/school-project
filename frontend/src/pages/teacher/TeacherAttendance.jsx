import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

const STATUSES = ['PRESENT', 'ABSENT', 'TARDY'];
const today = () => new Date().toISOString().slice(0, 10);

export default function TeacherAttendance() {
  const { session } = useAuth();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(today());
  const [roster, setRoster] = useState([]);
  const [marks, setMarks] = useState({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.myClasses(session.token).then(cs => {
      setClasses(cs);
      if (cs[0]) setClassId(cs[0].class_id);
    }).catch(err => setError(err.message));
  }, [session]);

  useEffect(() => {
    if (!classId) return;
    setSaved(false);
    Promise.all([api.classRoster(session.token, classId), api.getAttendance(session.token, classId, date)])
      .then(([students, existing]) => {
        setRoster(students);
        const existingByStudent = Object.fromEntries(existing.map(r => [r.student_id, r.status]));
        setMarks(Object.fromEntries(students.map(s => [s.student_id, existingByStudent[s.student_id] || 'PRESENT'])));
      })
      .catch(err => setError(err.message));
  }, [classId, date, session]);

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const records = roster.map(s => ({ student_id: s.student_id, status: marks[s.student_id] }));
      await api.markAttendance(session.token, classId, date, records);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="Daily Attendance">
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
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {saved && <div className="error-banner" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>Attendance saved for {date}.</div>}

        {roster.length === 0 ? (
          <div className="empty-state">No students in this class.</div>
        ) : (
          <table>
            <thead><tr><th>Student</th><th>Status</th></tr></thead>
            <tbody>
              {roster.map(s => (
                <tr key={s.student_id}>
                  <td>{s.name}</td>
                  <td>
                    <select value={marks[s.student_id]} onChange={e => setMarks({ ...marks, [s.student_id]: e.target.value })}>
                      {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {roster.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Attendance'}</button>
          </div>
        )}
      </div>
    </Layout>
  );
}
