import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import AccountView from '../../components/AccountView';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

const METHODS = ['CASH', 'GCASH', 'BANK_TRANSFER'];
const today = () => new Date().toISOString().slice(0, 10);

export default function AdminAccounts() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [account, setAccount] = useState(null);
  const [form, setForm] = useState({ amount: '', payment_date: today(), method: 'CASH', reference_no: '', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.listAccountStudents(session.token).then(list => {
      setStudents(list);
      const fromLink = searchParams.get('student');
      if (fromLink && list.some(s => s.student_id === fromLink)) setStudentId(fromLink);
      else if (list[0]) setStudentId(list[0].student_id);
    }).catch(err => setError(err.message));
  }, [session]);

  const searchTerm = search.trim().toLowerCase();
  const filteredStudents = students.filter(s =>
    !searchTerm || s.name.toLowerCase().includes(searchTerm) || s.lrn.includes(searchTerm)
  );

  useEffect(() => {
    if (filteredStudents.length > 0 && !filteredStudents.some(s => s.student_id === studentId)) {
      setStudentId(filteredStudents[0].student_id);
    }
  }, [search]);

  function loadAccount(id) {
    if (!id) return;
    api.getAccount(session.token, id).then(setAccount).catch(err => setError(err.message));
  }

  useEffect(() => { loadAccount(studentId); }, [studentId, session]);

  async function handleRecordPayment(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const updated = await api.recordPayment(session.token, studentId, {
        ...form,
        amount: Number(form.amount),
        reference_no: form.reference_no || undefined,
        notes: form.notes || undefined,
      });
      setAccount(updated);
      setForm({ amount: '', payment_date: today(), method: 'CASH', reference_no: '', notes: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="Student Accounts">
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <div>
            <label>Search</label>
            <input
              list="account-student-suggestions"
              placeholder="Name or LRN…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <datalist id="account-student-suggestions">
              {students.map(s => <option key={s.student_id} value={s.name} />)}
            </datalist>
          </div>
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div style={{ maxWidth: 360 }}>
            <label>Student ({filteredStudents.length})</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)}>
              {filteredStudents.map(s => (
                <option key={s.student_id} value={s.student_id}>
                  {s.name} — Grade {s.grade_level} {s.section} ({s.lrn})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {account && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button className="secondary" onClick={() => navigate(`/admin/students/${studentId}/soa`)}>
            Print Preview
          </button>
        </div>
      )}

      <AccountView account={account} />

      {account && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Record a Payment</h3>
          <form onSubmit={handleRecordPayment}>
            <div className="form-row">
              <div>
                <label>Amount (₱)</label>
                <input type="number" min="1" step="0.01" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label>Date</label>
                <input type="date" required value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} />
              </div>
              <div>
                <label>Method</label>
                <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                  {METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label>Reference No. (optional)</label>
                <input value={form.reference_no} onChange={e => setForm({ ...form, reference_no: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={saving}>{saving ? 'Recording…' : 'Record Payment'}</button>
          </form>
        </div>
      )}
    </Layout>
  );
}
