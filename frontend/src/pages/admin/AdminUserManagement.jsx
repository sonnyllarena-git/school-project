import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

const ROLE_LABEL = { ADMIN: 'Admin', REGISTRAR: 'Registrar', TEACHER: 'Teacher', STUDENT: 'Student' };

export default function AdminUserManagement() {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', password: '' });
  const [creatingTeacher, setCreatingTeacher] = useState(false);

  const [studentForm, setStudentForm] = useState({ name: '', lrn: '', date_of_birth: '', gender: 'M', class_id: '', email: '', password: '' });
  const [creatingStudent, setCreatingStudent] = useState(false);

  const [resettingUserId, setResettingUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  function load() {
    api.listUsers(session.token).then(setUsers).catch(err => setError(err.message));
  }

  useEffect(load, [session]);
  useEffect(() => {
    api.listClasses(session.token).then(list => {
      setClasses(list);
      if (list[0]) setStudentForm(f => ({ ...f, class_id: list[0].class_id }));
    }).catch(err => setError(err.message));
  }, [session]);

  async function handleCreateTeacher(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setCreatingTeacher(true);
    try {
      await api.createTeacher(session.token, teacherForm);
      setTeacherForm({ name: '', email: '', password: '' });
      setNotice('Teacher account created.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingTeacher(false);
    }
  }

  async function handleCreateStudent(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setCreatingStudent(true);
    try {
      await api.createStudent(session.token, studentForm);
      setStudentForm({ name: '', lrn: '', date_of_birth: '', gender: 'M', class_id: classes[0]?.class_id || '', email: '', password: '' });
      setNotice('Student account created.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingStudent(false);
    }
  }

  async function handleResetPassword(userId) {
    setError('');
    setNotice('');
    setResetting(true);
    try {
      await api.resetUserPassword(session.token, userId, newPassword);
      setResettingUserId(null);
      setNewPassword('');
      setNotice('Password reset.');
    } catch (err) {
      setError(err.message);
    } finally {
      setResetting(false);
    }
  }

  return (
    <Layout title="User Management">
      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="error-banner" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>{notice}</div>}

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <h3>Add Teacher</h3>
          <form onSubmit={handleCreateTeacher}>
            <div className="form-row">
              <div>
                <label>Name</label>
                <input value={teacherForm.name} required onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })} />
              </div>
              <div>
                <label>Email</label>
                <input type="email" value={teacherForm.email} required onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })} />
              </div>
              <div>
                <label>Temporary Password</label>
                <input value={teacherForm.password} required onChange={e => setTeacherForm({ ...teacherForm, password: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={creatingTeacher}>{creatingTeacher ? 'Adding…' : 'Add Teacher'}</button>
          </form>
        </div>

        <div className="card">
          <h3>Add Student</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
            Bulk roster changes still go through Import Roster — use this for one student who needs a portal login right away.
          </p>
          <form onSubmit={handleCreateStudent}>
            <div className="form-row">
              <div>
                <label>Name</label>
                <input value={studentForm.name} required onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} />
              </div>
              <div>
                <label>LRN</label>
                <input value={studentForm.lrn} required onChange={e => setStudentForm({ ...studentForm, lrn: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Date of Birth</label>
                <input type="date" value={studentForm.date_of_birth} required onChange={e => setStudentForm({ ...studentForm, date_of_birth: e.target.value })} />
              </div>
              <div>
                <label>Gender</label>
                <select value={studentForm.gender} onChange={e => setStudentForm({ ...studentForm, gender: e.target.value })}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div>
                <label>Class</label>
                <select value={studentForm.class_id} required onChange={e => setStudentForm({ ...studentForm, class_id: e.target.value })}>
                  {classes.map(c => (
                    <option key={c.class_id} value={c.class_id}>Grade {c.grade_level} — {c.section}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Email</label>
                <input type="email" value={studentForm.email} required onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} />
              </div>
              <div>
                <label>Temporary Password</label>
                <input value={studentForm.password} required onChange={e => setStudentForm({ ...studentForm, password: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={creatingStudent}>{creatingStudent ? 'Adding…' : 'Add Student'}</button>
          </form>
        </div>
      </div>

      <div className="card">
        <h3>All Users ({users.length})</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
          Reset a user's password directly — no need for them to know their old one.
        </p>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>LRN</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className="pill" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{ROLE_LABEL[u.role] || u.role}</span></td>
                <td>{u.lrn || '—'}</td>
                <td>
                  {resettingUserId === u.user_id ? (
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="New password"
                        style={{ width: 140 }}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                      />
                      <button disabled={resetting || newPassword.length < 6} onClick={() => handleResetPassword(u.user_id)}>
                        {resetting ? 'Saving…' : 'Save'}
                      </button>
                      <button className="ghost" onClick={() => { setResettingUserId(null); setNewPassword(''); }}>Cancel</button>
                    </span>
                  ) : (
                    <button className="secondary" onClick={() => { setResettingUserId(u.user_id); setNewPassword(''); }}>
                      Reset Password
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
