import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

export default function AdminStudents() {
  const { session } = useAuth();
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    api.listStudents(session.token).then(setStudents).catch(err => setError(err.message));
  }

  useEffect(load, [session]);

  async function handleDelete(studentId) {
    setError('');
    setDeleting(true);
    try {
      await api.deleteStudent(session.token, studentId);
      setConfirming(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Layout title="Students">
      <div className="card">
        <h3>All Students ({students.length})</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
          Deleting a student is permanent — it removes their attendance, grades, guardian links, and login account (right-to-deletion, CLAUDE.md §1.1).
        </p>
        {error && <div className="error-banner">{error}</div>}
        <table>
          <thead><tr><th>LRN</th><th>Name</th><th>Class</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {students.map(s => (
              <tr key={s.student_id}>
                <td>{s.lrn}</td>
                <td>{s.name}</td>
                <td>{s.class_id}</td>
                <td>{s.status}</td>
                <td>
                  {confirming === s.student_id ? (
                    <span style={{ display: 'flex', gap: 6 }}>
                      <button className="danger" disabled={deleting} onClick={() => handleDelete(s.student_id)}>
                        {deleting ? 'Deleting…' : 'Confirm delete'}
                      </button>
                      <button className="ghost" onClick={() => setConfirming(null)}>Cancel</button>
                    </span>
                  ) : (
                    <button className="danger" onClick={() => setConfirming(s.student_id)}>Delete</button>
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
