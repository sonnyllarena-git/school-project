import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

// Every document type this tab can generate. Gating today is all-or-nothing
// at the route level (this whole tab is ADMIN+REGISTRAR only — Cashier
// access, e.g. SOA-only, is a deliberately deferred decision, not built
// yet). If that changes, add a `roles` array per entry here and filter.
const DOCUMENT_TYPES = [
  { key: 'certificate', label: 'Certificate of Matriculation', description: 'Requires an already-issued certificate for the student (see the Enrollment tab).', path: id => `/admin/students/${id}/certificate` },
  { key: 'good-moral', label: 'Good Moral Certificate', description: 'Certifies the student has no disciplinary record on file.', path: id => `/admin/students/${id}/good-moral` },
  { key: 'honorable-dismissal', label: 'Honorable Dismissal', description: 'For a student transferring to another school.', path: id => `/admin/students/${id}/honorable-dismissal` },
  { key: 'transcript', label: 'Transcript of Records', description: 'Cumulative grades across every grade level on file.', path: id => `/admin/students/${id}/transcript` },
  { key: 'soa', label: 'Statement of Account', description: "The student's current itemized charges and payment history.", path: id => `/admin/students/${id}/soa` },
  { key: 'report-card', label: 'Report Card', description: 'Per-quarter grades for the current grade level.', path: id => `/admin/students/${id}/report-card` },
];

export default function RegistrarDocuments() {
  const { session } = useAuth();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.listAccountStudents(session.token).then(list => {
      setStudents(list);
      if (list[0]) setStudentId(list[0].student_id);
    }).catch(err => setError(err.message));
  }, [session]);

  const searchTerm = search.trim().toLowerCase();
  const filtered = students.filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm) || s.lrn.includes(searchTerm));

  return (
    <Layout title="Documents">
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Select Student</h3>
        {error && <div className="error-banner">{error}</div>}
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div>
            <label>Search</label>
            <input placeholder="Name or LRN…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ maxWidth: 360 }}>
            <label>Student ({filtered.length})</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)}>
              {filtered.map(s => (
                <option key={s.student_id} value={s.student_id}>
                  {s.name} — Grade {s.grade_level} {s.section} ({s.lrn})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {DOCUMENT_TYPES.map(doc => (
          <div key={doc.key} className="card">
            <h3>{doc.label}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8, minHeight: 34 }}>{doc.description}</p>
            <button
              disabled={!studentId}
              onClick={() => window.open(doc.path(studentId), '_blank')}
            >
              Generate / Print
            </button>
          </div>
        ))}
      </div>
    </Layout>
  );
}
