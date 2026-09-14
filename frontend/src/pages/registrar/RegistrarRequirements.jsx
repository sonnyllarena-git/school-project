import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

const STATUS_OPTIONS = ['PENDING', 'SUBMITTED', 'VERIFIED'];
const STATUS_PILL = { PENDING: 'danger', SUBMITTED: 'warn', VERIFIED: 'success' };

export default function RegistrarRequirements() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [checklist, setChecklist] = useState(null);
  const [search, setSearch] = useState('');
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);

  function loadStudents() {
    api.listRequirementStudents(session.token).then(list => {
      setStudents(list);
      const fromLink = searchParams.get('student');
      if (fromLink && list.some(s => s.student_id === fromLink)) setStudentId(fromLink);
      else if (!studentId && list[0]) setStudentId(list[0].student_id);
    }).catch(err => setError(err.message));
  }

  useEffect(loadStudents, [session]);

  function loadChecklist(id) {
    if (!id) return;
    api.getStudentRequirements(session.token, id).then(setChecklist).catch(err => setError(err.message));
  }

  useEffect(() => { loadChecklist(studentId); }, [studentId, session]);

  const searchTerm = search.trim().toLowerCase();
  const filtered = students.filter(s =>
    (!searchTerm || s.name.toLowerCase().includes(searchTerm) || s.lrn.includes(searchTerm)) &&
    (!incompleteOnly || !s.complete)
  );

  const selected = useMemo(() => students.find(s => s.student_id === studentId), [students, studentId]);

  async function handleStatusChange(requirementType, status) {
    setError('');
    setSaving(requirementType);
    try {
      const updated = await api.updateRequirement(session.token, studentId, requirementType, { status });
      setChecklist(prev => ({ ...prev, checklist: updated.checklist }));
      loadStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <Layout title="Requirements">
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3>Students ({filtered.length})</h3>
          <div className="form-row">
            <div>
              <label>Search</label>
              <input placeholder="Name or LRN…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 12 }}>
            <input type="checkbox" checked={incompleteOnly} onChange={e => setIncompleteOnly(e.target.checked)} />
            Show incomplete only
          </label>
          {error && <div className="error-banner">{error}</div>}
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            <table>
              <thead><tr><th>Student</th><th>Grade</th><th>Progress</th></tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr
                    key={s.student_id}
                    style={{ cursor: 'pointer', background: s.student_id === studentId ? 'var(--accent-soft)' : undefined }}
                    onClick={() => setStudentId(s.student_id)}
                  >
                    <td>{s.name} ({s.lrn})</td>
                    <td>Grade {s.grade_level} — {s.section}</td>
                    <td>
                      <span className={`pill ${s.complete ? 'success' : 'warn'}`}>
                        {s.verified_count}/{s.total_required}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          {selected && <h3>{selected.name} — Requirements Checklist</h3>}
          {!checklist ? (
            <div className="empty-state">Select a student.</div>
          ) : (
            <table>
              <thead><tr><th>Requirement</th><th>Status</th></tr></thead>
              <tbody>
                {checklist.checklist.map(item => (
                  <tr key={item.requirement_type}>
                    <td>{item.requirement_type}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className={`pill ${STATUS_PILL[item.status]}`}>{item.status}</span>
                        <select
                          value={item.status}
                          disabled={saving === item.requirement_type}
                          onChange={e => handleStatusChange(item.requirement_type, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
