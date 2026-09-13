import StatCard from './StatCard';

const STATUS_LABEL = {
  FULLY_PAID: 'Fully Paid — Enrolled',
  PARTIALLY_PAID: 'Partially Paid',
  PENDING_PAYMENT: 'Pending Payment',
};
const STATUS_PILL = {
  FULLY_PAID: 'success',
  PARTIALLY_PAID: 'warn',
  PENDING_PAYMENT: 'danger',
};

const peso = n => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export default function AccountView({ account }) {
  if (!account) return <div className="empty-state">Loading…</div>;

  return (
    <>
      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <StatCard label="Total Assessed" value={peso(account.total_assessed)} />
        <StatCard label="Total Paid" value={peso(account.total_paid)} />
        <StatCard label="Balance" value={peso(account.balance)} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <span className={`pill ${STATUS_PILL[account.status]}`} style={{ fontSize: 13, padding: '6px 14px' }}>
          {STATUS_LABEL[account.status] || account.status}
        </span>
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
              <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead>
              <tbody>
                {account.payments.map(p => (
                  <tr key={p.payment_id}>
                    <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td>{peso(p.amount)}</td>
                    <td>{p.method.replace('_', ' ')}</td>
                    <td>{p.reference_no || '—'}</td>
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
