import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import StudentDetailModal from '../../components/StudentDetailModal';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';
import { STATUS_LABEL, STATUS_PILL, STATUS_OPTIONS } from '../../lib/accountStatus';

export default function AdminStudents() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [gradeFilter, setGradeFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  function load() {
    api.listStudents(session.token).then(list => {
      setStudents(list);
      const fromLink = searchParams.get('student');
      if (fromLink) {
        const match = list.find(s => s.student_id === fromLink);
        if (match) setSelected(match);
      }
    }).catch(err => setError(err.message));
  }

  useEffect(load, [session]);

  const grades = useMemo(
    () => [...new Set(students.map(s => s.grade_level).filter(g => g != null))].sort((a, b) => a - b),
    [students]
  );
  const sections = useMemo(
    () => [...new Set(students.map(s => s.section).filter(Boolean))].sort(),
    [students]
  );
  const searchTerm = search.trim().toLowerCase();
  const filtered = students.filter(s =>
    (!gradeFilter || String(s.grade_level) === gradeFilter) &&
    (!sectionFilter || s.section === sectionFilter) &&
    (!statusFilter || s.enrollment_status === statusFilter) &&
    (!searchTerm || s.name.toLowerCase().includes(searchTerm) || s.lrn.includes(searchTerm))
  );

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
        <h3>All Students ({filtered.length}{filtered.length !== students.length ? ` of ${students.length}` : ''})</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
          Deleting a student is permanent — it removes their attendance, grades, guardian links, and login account (right-to-deletion, CLAUDE.md §1.1).
          Double-click a row to view that student's details.
        </p>
        {error && <div className="error-banner">{error}</div>}
        <div className="form-row">
          <div>
            <label>Search</label>
            <input
              list="student-suggestions"
              placeholder="Name or LRN…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <datalist id="student-suggestions">
              {students.map(s => <option key={s.student_id} value={s.name} />)}
            </datalist>
          </div>
          <div>
            <label>Grade</label>
            <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
              <option value="">All</option>
              {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
          <div>
            <label>Section</label>
            <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
              <option value="">All</option>
              {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
            </select>
          </div>
          <div>
            <label>Enrollment Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <table>
          <thead><tr><th>LRN</th><th>Name</th><th>Grade</th><th>Section</th><th>Enrollment Status</th><th></th></tr></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.student_id} style={{ cursor: 'pointer' }} onDoubleClick={() => setSelected(s)}>
                <td>{s.lrn}</td>
                <td>{s.name}</td>
                <td>{s.grade_level ?? '—'}</td>
                <td>{s.section || '—'}</td>
                <td>
                  <span className={`pill ${STATUS_PILL[s.enrollment_status]}`}>
                    {STATUS_LABEL[s.enrollment_status] || s.enrollment_status}
                  </span>
                </td>
                <td onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
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

      {selected && (
        <StudentDetailModal token={session.token} student={selected} onClose={() => setSelected(null)} />
      )}
    </Layout>
  );
}
