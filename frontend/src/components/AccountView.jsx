import StatCard from './StatCard';
import RequirementsBadge from './RequirementsBadge';
import { STATUS_LABEL, STATUS_PILL } from '../lib/accountStatus';

const peso = n => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export default function AccountView({ account }) {
  if (!account) return <div className="empty-state">Loading…</div>;

  return (
    <>
      {(account.grade_level || account.adviser_name) && (
        <div className="form-row" style={{ marginBottom: 16 }}>
          <div>
            <label>Grade & Section</label>
            <div>{account.grade_level ? `Grade ${account.grade_level} — ${account.section}` : '—'}</div>
          </div>
          <div>
            <label>Adviser</label>
            <div>{account.adviser_name || '—'}</div>
          </div>
        </div>
      )}

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <StatCard label="Total Assessed" value={peso(account.total_assessed)} />
        <StatCard label="Total Paid" value={peso(account.total_paid)} />
        <StatCard label="Balance" value={peso(account.balance)} />
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className={`pill ${STATUS_PILL[account.status]}`} style={{ fontSize: 13, padding: '6px 14px' }}>
          {STATUS_LABEL[account.status] || account.status}
        </span>
        <RequirementsBadge studentId={account.student_id} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Statement of Account — {account.school_year}</h3>
          <table>
            <thead><tr><th>Item</th><th>Amount</th></tr></thead>
            <tbody>
              {account.fee_items.map(f => (
                <tr key={f.fee_item_id}><td>{f.fee_type}</td><td>{peso(f.amount)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Payment History</h3>
          {account.payments.length === 0 ? (
            <div className="empty-state">No payments recorded yet.</div>
          ) : (
            <table>
              <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th>{account.student_id && <th></th>}</tr></thead>
              <tbody>
                {account.payments.map(p => (
                  <tr key={p.payment_id}>
                    <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td>{peso(p.amount)}</td>
                    <td>{p.method.replace('_', ' ')}</td>
                    <td>{p.reference_no || '—'}</td>
                    {/* account.student_id only comes back on the admin/registrar/
                        cashier getAccount response, not the student's own
                        myAccount — a student can't reach the receipt route,
                        so this naturally hides the link on their self-view. */}
                    {account.student_id && (
                      <td>
                        <button
                          className="ghost"
                          style={{ padding: 0, fontSize: 12, textDecoration: 'underline', color: 'var(--accent)' }}
                          onClick={() => window.open(`/admin/students/${account.student_id}/receipt/${p.payment_id}`, '_blank')}
                        >
                          Print Receipt
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
