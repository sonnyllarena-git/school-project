import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Layout from '../../components/Layout';
import StudentDetailModal from '../../components/StudentDetailModal';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';
import { STATUS_LABEL, STATUS_PILL, STATUS_OPTIONS } from '../../lib/accountStatus';

// Placeholder gate only — not a real credential, just a deliberate extra
// step before a permanent delete. Compared case-insensitively so caps-lock
// doesn't trip someone up.
const DELETION_PASSWORD = 'delete';

export default function AdminStudents() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [requirementsByStudent, setRequirementsByStudent] = useState({});
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
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
    // One bulk fetch for the whole roster's requirements-complete flag,
    // rather than 150 individual per-row lookups.
    api.listRequirementStudents(session.token)
      .then(list => setRequirementsByStudent(Object.fromEntries(list.map(r => [r.student_id, r]))))
      .catch(() => {});
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

  function closeDeleteModal() {
    setDeleteTarget(null);
    setDeletePassword('');
    setDeleteError('');
  }

  async function handleConfirmDelete() {
    if (deletePassword.trim().toLowerCase() !== DELETION_PASSWORD) {
      setDeleteError('Incorrect deletion password.');
      return;
    }
    setDeleteError('');
    setDeleting(true);
    try {
      await api.deleteStudent(session.token, deleteTarget.student_id);
      closeDeleteModal();
      load();
    } catch (err) {
      setDeleteError(err.message);
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
          <thead><tr><th>LRN</th><th>Name</th><th>Grade</th><th>Section</th><th>Enrollment Status</th><th>Requirements</th><th></th></tr></thead>
          <tbody>
            {filtered.map(s => {
              const req = requirementsByStudent[s.student_id];
              return (
              <tr key={s.student_id} className="row-hover" onDoubleClick={() => setSelected(s)}>
                <td>{s.lrn}</td>
                <td>{s.name}</td>
                <td>{s.grade_level ?? '—'}</td>
                <td>{s.section || '—'}</td>
                <td>
                  <span className={`pill ${STATUS_PILL[s.enrollment_status]}`} style={{ cursor: 'pointer' }}>
                    {STATUS_LABEL[s.enrollment_status] || s.enrollment_status}
                  </span>
                </td>
                <td onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
                  {req && (
                    req.complete ? (
                      <span className="pill success" style={{ cursor: 'pointer' }}>Requirements Complete</span>
                    ) : (
                      <button
                        style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                          border: 'none', cursor: 'pointer', background: 'var(--danger-soft)', color: 'var(--danger)',
                        }}
                        onClick={() => navigate(`/registrar/requirements?student=${s.student_id}`)}
                      >
                        Pending Requirement
                      </button>
                    )
                  )}
                </td>
                <td onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
                  <button className="danger" onClick={() => setDeleteTarget(s)}>Delete</button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <StudentDetailModal token={session.token} student={selected} onClose={() => setSelected(null)} />
      )}

      {deleteTarget && (
        <div className="modal-backdrop center" onClick={closeDeleteModal}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Delete {deleteTarget.name}?</h3>
              <button className="ghost icon-btn" onClick={closeDeleteModal}><XMarkIcon width={20} /></button>
            </div>
            <div className="modal-section">
              <div className="error-banner">
                This is permanent — it removes their attendance, grades, guardian links, and login account
                (right-to-deletion, CLAUDE.md §1.1).
              </div>
              <label>Type the deletion password to confirm</label>
              <input
                type="password"
                autoFocus
                value={deletePassword}
                onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleConfirmDelete()}
              />
              {deleteError && <div className="error-banner" style={{ marginTop: 10 }}>{deleteError}</div>}
            </div>
            <div className="modal-section" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="ghost" onClick={closeDeleteModal}>Cancel</button>
              <button className="danger" disabled={deleting} onClick={handleConfirmDelete}>
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
