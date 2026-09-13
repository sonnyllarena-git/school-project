import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

// Must match backend/src/lib/curriculum.js SUBJECTS — the curriculum is fixed
// for this mock school, so there's no endpoint to fetch it dynamically.
const SUBJECTS = ['Filipino', 'English', 'Math', 'Science', 'Values Education'];

export default function AdminTeachers() {
  const { session } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);

  function load() {
    api.listTeachers(session.token).then(setTeachers).catch(err => setError(err.message));
  }

  useEffect(load, [session]);

  async function toggleSubject(teacher, subject) {
    const next = teacher.subjects.includes(subject)
      ? teacher.subjects.filter(s => s !== subject)
      : [...teacher.subjects, subject];
    setSavingId(teacher.teacher_id);
    setError('');
    try {
      await api.updateTeacherSubjects(session.token, teacher.teacher_id, next);
      setTeachers(ts => ts.map(t => t.teacher_id === teacher.teacher_id ? { ...t, subjects: next } : t));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.createTeacher(session.token, form);
      setForm({ name: '', email: '', password: '' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Layout title="Teachers">
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Add Teacher</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <div>
              <label>Name</label>
              <input value={form.name} required onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={form.email} required onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label>Temporary Password</label>
              <input value={form.password} required onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={creating}>{creating ? 'Adding…' : 'Add Teacher'}</button>
        </form>
      </div>

      <div className="card">
        <h3>All Teachers ({teachers.length})</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
          Click a subject to assign or unassign it from that teacher.
        </p>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Advises</th><th>Subjects</th></tr></thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.teacher_id}>
                <td>{t.name}</td>
                <td>{t.email}</td>
                <td>{t.advises_grade ? `Grade ${t.advises_grade} — ${t.advises_section}` : '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {SUBJECTS.map(subject => (
                      <button
                        key={subject}
                        type="button"
                        disabled={savingId === t.teacher_id}
                        className={t.subjects.includes(subject) ? 'secondary' : 'ghost'}
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => toggleSubject(t, subject)}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
