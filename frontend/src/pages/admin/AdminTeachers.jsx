import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

export default function AdminTeachers() {
  const { session } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    api.listTeachers(session.token).then(setTeachers).catch(err => setError(err.message));
  }

  useEffect(load, [session]);

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
        <table>
          <thead><tr><th>Name</th><th>Email</th></tr></thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.teacher_id}><td>{t.name}</td><td>{t.email}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
