import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

const STAGES = ['VERIFIED', 'ASSESSED', 'PRINTED', 'CERTIFICATE_ISSUED'];
const STAGE_LABEL = {
  VERIFIED: 'Verified',
  ASSESSED: 'Assessed (SOA generated)',
  PRINTED: 'Printed for parent',
  CERTIFICATE_ISSUED: 'Certificate Issued — Enrolled',
};
const METHODS = ['CASH', 'GCASH', 'BANK_TRANSFER'];
const today = () => new Date().toISOString().slice(0, 10);

export default function AdminEnrollment() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [eligibility, setEligibility] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [account, setAccount] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', payment_date: today(), method: 'CASH', reference_no: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listAccountStudents(session.token).then(list => {
      setStudents(list);
      if (list[0]) setStudentId(list[0].student_id);
    }).catch(err => setError(err.message));
  }, [session]);

  function load(id) {
    if (!id) return;
    setError('');
    api.getEligibility(session.token, id).then(setEligibility).catch(err => setError(err.message));
    api.getEnrollment(session.token, id).then(setEnrollment).catch(err => setError(err.message));
  }

  useEffect(() => { load(studentId); }, [studentId, session]);

  useEffect(() => {
    if (!enrollment) { setAccount(null); return; }
    api.getAccount(session.token, studentId, enrollment.school_year).then(setAccount).catch(() => {});
  }, [enrollment, studentId, session]);

  async function runAction(action) {
    setError('');
    setBusy(true);
    try {
      const updated = await action();
      setEnrollment(updated);
      load(studentId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePay(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const updated = await api.recordPayment(session.token, studentId, {
        ...payForm,
        amount: Number(payForm.amount),
        school_year: enrollment.school_year,
        reference_no: payForm.reference_no || undefined,
      });
      setAccount(updated);
      setPayForm({ amount: '', payment_date: today(), method: 'CASH', reference_no: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const stageIndex = enrollment ? STAGES.indexOf(enrollment.status) : -1;

  return (
    <Layout title="Re-Enrollment / Promotion">
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div style={{ maxWidth: 320 }}>
            <label>Student</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)}>
              {students.map(s => (
                <option key={s.student_id} value={s.student_id}>{s.name} — {s.class_id} ({s.lrn})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {eligibility && (
        <div className="grid grid-3" style={{ marginBottom: 20 }}>
          <StatCard label="Current Grade" value={eligibility.current_grade} />
          <StatCard label="Current-Year Balance" value={`₱${Number(eligibility.balance).toLocaleString()}`} />
          <StatCard label="Failing Subjects" value={eligibility.failing_subjects.length || 'None'} />
        </div>
      )}

      {eligibility && !enrollment && (
        <div className="card">
          <h3>Promotion Eligibility</h3>
          {eligibility.eligible ? (
            <>
              <p style={{ color: 'var(--success)' }}>Eligible for promotion to Grade {eligibility.current_grade + 1}.</p>
              <button disabled={busy} onClick={() => runAction(() => api.verifyEnrollment(session.token, studentId))}>
                {busy ? 'Working…' : 'Verify Student'}
              </button>
            </>
          ) : (
            <div className="error-banner">
              Not yet eligible — {eligibility.balance > 0 && `outstanding balance of ₱${Number(eligibility.balance).toLocaleString()}`}
              {eligibility.balance > 0 && eligibility.failing_subjects.length > 0 && ' and '}
              {eligibility.failing_subjects.length > 0 && `failing grade(s) in ${eligibility.failing_subjects.join(', ')}`}.
            </div>
          )}
        </div>
      )}

      {enrollment && (
        <div className="card">
          <h3>Promotion Pipeline — Grade {enrollment.grade_level} ({enrollment.school_year})</h3>
          <div className="tabs" style={{ borderBottom: 'none', marginBottom: 20 }}>
            {STAGES.map((s, i) => (
              <span key={s} className={`pill ${i <= stageIndex ? 'success' : ''}`} style={{ marginRight: 8 }}>
                {STAGE_LABEL[s]}
              </span>
            ))}
          </div>

          {enrollment.status === 'VERIFIED' && (
            <button disabled={busy} onClick={() => runAction(() => api.assessEnrollment(session.token, studentId))}>
              {busy ? 'Working…' : 'Generate Assessment (SOA)'}
            </button>
          )}

          {enrollment.status === 'ASSESSED' && (
            <button disabled={busy} onClick={() => runAction(() => api.markPrinted(session.token, studentId))}>
              {busy ? 'Working…' : 'Mark as Printed for Parent'}
            </button>
          )}

          {enrollment.status === 'PRINTED' && account && (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -4 }}>
                Waiting on parent review/approval (offline) and payment for {enrollment.school_year}.
              </p>
              <div className="grid grid-3" style={{ marginBottom: 16 }}>
                <StatCard label="Assessed" value={`₱${Number(account.total_assessed).toLocaleString()}`} />
                <StatCard label="Paid" value={`₱${Number(account.total_paid).toLocaleString()}`} />
                <StatCard label="Balance" value={`₱${Number(account.balance).toLocaleString()}`} />
              </div>

              {account.status !== 'FULLY_PAID' ? (
                <form onSubmit={handlePay}>
                  <div className="form-row">
                    <div>
                      <label>Amount (₱)</label>
                      <input type="number" min="1" step="0.01" required value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
                    </div>
                    <div>
                      <label>Date</label>
                      <input type="date" required value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} />
                    </div>
                    <div>
                      <label>Method</label>
                      <select value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
                        {METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>Reference No. (optional)</label>
                      <input value={payForm.reference_no} onChange={e => setPayForm({ ...payForm, reference_no: e.target.value })} />
                    </div>
                  </div>
                  <button type="submit" disabled={busy}>{busy ? 'Recording…' : 'Record Payment'}</button>
                </form>
              ) : (
                <button disabled={busy} onClick={() => runAction(() => api.issueCertificate(session.token, studentId))}>
                  {busy ? 'Working…' : 'Issue Certificate of Matriculation'}
                </button>
              )}
            </>
          )}

          {enrollment.status === 'CERTIFICATE_ISSUED' && (
            <button className="secondary" onClick={() => navigate(`/admin/students/${studentId}/certificate`)}>
              View / Print Certificate
            </button>
          )}
        </div>
      )}
    </Layout>
  );
}
