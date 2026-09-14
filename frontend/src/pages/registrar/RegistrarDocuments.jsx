import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

// Every document type this tab can generate, gated per-role now that Cashier
// has been added: Cashier only sees the two financial documents (SOA,
// Official Receipt), while the academic/registrar-record ones (Good Moral,
// Honorable Dismissal, Transcript, Certificate of Matriculation) stay
// Admin+Registrar only.
const ADMIN_REGISTRAR = ['ADMIN', 'REGISTRAR'];
const ADMIN_REGISTRAR_CASHIER = ['ADMIN', 'REGISTRAR', 'CASHIER'];

const DOCUMENT_TYPES = [
  { key: 'certificate', label: 'Certificate of Matriculation', description: 'Requires an already-issued certificate for the student (see the Enrollment tab).', roles: ADMIN_REGISTRAR, path: id => `/admin/students/${id}/certificate` },
  { key: 'good-moral', label: 'Good Moral Certificate', description: 'Certifies the student has no disciplinary record on file.', roles: ADMIN_REGISTRAR, path: id => `/admin/students/${id}/good-moral` },
  { key: 'honorable-dismissal', label: 'Honorable Dismissal', description: 'For a student transferring to another school.', roles: ADMIN_REGISTRAR, path: id => `/admin/students/${id}/honorable-dismissal` },
  { key: 'transcript', label: 'Transcript of Records', description: 'Cumulative grades across every grade level on file.', roles: ADMIN_REGISTRAR, path: id => `/admin/students/${id}/transcript` },
  { key: 'soa', label: 'Statement of Account', description: "The student's current itemized charges and payment history.", roles: ADMIN_REGISTRAR_CASHIER, path: id => `/admin/students/${id}/soa` },
  { key: 'report-card', label: 'Report Card', description: 'Per-quarter grades for the current grade level.', roles: ADMIN_REGISTRAR, path: id => `/admin/students/${id}/report-card` },
];

export default function RegistrarDocuments() {
  const { session } = useAuth();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  // undefined = not fetched yet, null = fetched and confirmed no payments —
  // kept distinct so the button doesn't briefly flash "No Payments Yet"
  // while the lookup for a student who does have one is still in flight.
  const [latestPaymentId, setLatestPaymentId] = useState(undefined);

  useEffect(() => {
    api.listAccountStudents(session.token).then(list => {
      setStudents(list);
      if (list[0]) setStudentId(list[0].student_id);
    }).catch(err => setError(err.message));
  }, [session]);

  useEffect(() => {
    if (!studentId) return;
    setLatestPaymentId(undefined);
    api.getLatestPayment(session.token, studentId).then(p => setLatestPaymentId(p?.payment_id || null)).catch(() => {});
  }, [session, studentId]);

  const searchTerm = search.trim().toLowerCase();
  const filtered = students.filter(s => !searchTerm || s.name.toLowerCase().includes(searchTerm) || s.lrn.includes(searchTerm));
  const visibleTypes = DOCUMENT_TYPES.filter(doc => doc.roles.includes(session.user.role));

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
        {visibleTypes.map(doc => (
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

        <div className="card">
          <h3>Official Receipt</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8, minHeight: 34 }}>
            Reprints the student's most recent payment. For an older payment, print it from the Accounts or Accounting page instead.
          </p>
          <button
            disabled={!studentId || !latestPaymentId}
            onClick={() => window.open(`/admin/students/${studentId}/receipt/${latestPaymentId}`, '_blank')}
          >
            {studentId && latestPaymentId === null ? 'No Payments Yet' : 'Generate / Print'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
