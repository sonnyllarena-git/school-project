import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import RequirementsBadge from '../../components/RequirementsBadge';
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
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [eligibility, setEligibility] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [account, setAccount] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', payment_date: today(), method: 'CASH', reference_no: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ fee_type: '', amount: '' });
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ fee_type: '', amount: '' });

  useEffect(() => {
    api.listAccountStudents(session.token).then(list => {
      setStudents(list);
      const fromLink = searchParams.get('student');
      if (fromLink && list.some(s => s.student_id === fromLink)) setStudentId(fromLink);
      else if (list[0]) setStudentId(list[0].student_id);
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

  function startEditItem(item) {
    setEditingItem(item.fee_item_id);
    setItemForm({ fee_type: item.fee_type, amount: item.amount });
  }

  async function saveEditItem(feeItemId) {
    setError('');
    setBusy(true);
    try {
      const updated = await api.updateFeeItem(session.token, studentId, feeItemId, {
        fee_type: itemForm.fee_type,
        amount: Number(itemForm.amount),
      });
      setAccount(updated);
      setEditingItem(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(feeItemId) {
    setError('');
    setBusy(true);
    try {
      setAccount(await api.deleteFeeItem(session.token, studentId, feeItemId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddItem(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const updated = await api.addFeeItem(session.token, studentId, {
        school_year: enrollment.school_year,
        fee_type: newItem.fee_type,
        amount: Number(newItem.amount),
      });
      setAccount(updated);
      setNewItem({ fee_type: '', amount: '' });
      setAddingItem(false);
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

      {studentId && (
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Requirements:</span>
          <RequirementsBadge studentId={studentId} />
        </div>
      )}

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
            <>
              <div className="error-banner">
                Not yet eligible — {eligibility.balance > 0 && `outstanding balance of ₱${Number(eligibility.balance).toLocaleString()}`}
                {eligibility.balance > 0 && eligibility.failing_subjects.length > 0 && ' and '}
                {eligibility.failing_subjects.length > 0 && `failing grade(s) in ${eligibility.failing_subjects.join(', ')}`}.
              </div>
              {eligibility.balance > 0 && (
                <>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    Admin/Cashier/Registrar: record the missing payment on the student's Account before re-checking eligibility here.
                  </p>
                  <button className="secondary" onClick={() => navigate(`/admin/accounts?student=${studentId}`)}>
                    View Account
                  </button>
                </>
              )}
              {eligibility.failing_subjects.length > 0 && (
                <>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: eligibility.balance > 0 ? 12 : 0 }}>
                    Admin/Registrar/Teacher: review the per-quarter grades below before deciding on a manual override or a grade correction.
                  </p>
                  <button className="secondary" onClick={() => navigate(`/admin/students?student=${studentId}`)}>
                    View Grades
                  </button>
                </>
              )}
            </>
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

          {(enrollment.status === 'ASSESSED' || enrollment.status === 'PRINTED') && account && (
            <div className="card" style={{ marginBottom: 20, boxShadow: 'none', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Statement of Account — {enrollment.school_year}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!addingItem && (
                    <button className="ghost" style={{ fontSize: 13, padding: '4px 10px' }} onClick={() => setAddingItem(true)}>+ Add Item</button>
                  )}
                  <button
                    className="secondary"
                    style={{ fontSize: 13, padding: '4px 10px' }}
                    onClick={() => window.open(`/admin/students/${studentId}/soa?school_year=${enrollment.school_year}`, '_blank')}
                  >
                    Print Preview
                  </button>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -4 }}>
                Print this for the parent to review. If they flag a correction, edit or remove an item below before payment.
              </p>

              <table>
                <thead><tr><th>Item</th><th>Amount</th><th></th></tr></thead>
                <tbody>
                  {account.fee_items.map(item => (
                    <tr key={item.fee_item_id}>
                      {editingItem === item.fee_item_id ? (
                        <>
                          <td><input value={itemForm.fee_type} onChange={e => setItemForm({ ...itemForm, fee_type: e.target.value })} /></td>
                          <td><input type="number" min="0.01" step="0.01" style={{ width: 100 }} value={itemForm.amount} onChange={e => setItemForm({ ...itemForm, amount: e.target.value })} /></td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <button disabled={busy} onClick={() => saveEditItem(item.fee_item_id)}>Save</button>{' '}
                            <button type="button" className="ghost" onClick={() => setEditingItem(null)}>Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{item.fee_type}</td>
                          <td>₱{Number(item.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <button className="ghost" style={{ fontSize: 12, padding: '3px 8px' }} onClick={() => startEditItem(item)}>Edit</button>{' '}
                            <button className="ghost" style={{ fontSize: 12, padding: '3px 8px', color: 'var(--danger)' }} disabled={busy} onClick={() => removeItem(item.fee_item_id)}>Remove</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {addingItem && (
                <form onSubmit={handleAddItem} style={{ marginTop: 12 }}>
                  <div className="form-row">
                    <div>
                      <label>Item</label>
                      <input required value={newItem.fee_type} onChange={e => setNewItem({ ...newItem, fee_type: e.target.value })} />
                    </div>
                    <div>
                      <label>Amount (₱)</label>
                      <input type="number" min="0.01" step="0.01" required value={newItem.amount} onChange={e => setNewItem({ ...newItem, amount: e.target.value })} />
                    </div>
                  </div>
                  <button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add Item'}</button>{' '}
                  <button type="button" className="ghost" onClick={() => { setAddingItem(false); setNewItem({ fee_type: '', amount: '' }); }}>Cancel</button>
                </form>
              )}

              <div style={{ textAlign: 'right', marginTop: 12, fontSize: 15 }}>
                Total Assessed: <strong>₱{Number(account.total_assessed).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
          )}

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

              {account.status === 'PENDING_PAYMENT' && (
                <div className="error-banner" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
                  At least a partial payment for {enrollment.school_year} is required before the certificate can be issued.
                </div>
              )}

              {/* Recording a payment is Cashier's job now, not Registrar's — the
                  backend would 403 anyway, but showing a form that can't
                  actually be submitted would just be confusing. */}
              {account.balance > 0 && session.user.role !== 'REGISTRAR' && (
                <form onSubmit={handlePay} style={{ marginBottom: account.status !== 'PENDING_PAYMENT' ? 20 : 0 }}>
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
              )}
              {account.balance > 0 && session.user.role === 'REGISTRAR' && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Payments are recorded by the Cashier — send the parent there to settle the balance above.
                </p>
              )}

              {account.status !== 'PENDING_PAYMENT' && (
                <>
                  {account.balance > 0 && (
                    <p style={{ color: 'var(--warn)', fontSize: 13 }}>
                      Issuing now promotes the student with an outstanding balance of ₱{Number(account.balance).toLocaleString()}
                      {' '}for {enrollment.school_year} — it will still show on the Accounts page.
                    </p>
                  )}
                  <button disabled={busy} onClick={() => runAction(() => api.issueCertificate(session.token, studentId))}>
                    {busy ? 'Working…' : 'Issue Certificate of Matriculation'}
                  </button>
                </>
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
