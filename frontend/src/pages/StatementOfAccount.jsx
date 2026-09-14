import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import { STATUS_LABEL, STATUS_PILL } from '../lib/accountStatus';

const peso = n => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export default function StatementOfAccount({ source }) {
  const { session } = useAuth();
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const schoolYear = searchParams.get('school_year');
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetcher = source === 'admin' ? api.getAccount(session.token, studentId, schoolYear) : api.myAccount(session.token);
    fetcher.then(setAccount).catch(err => setError(err.message));
  }, [session, source, studentId, schoolYear]);

  const backLink = source === 'admin'
    ? (schoolYear ? `/admin/enrollment?student=${studentId}` : `/admin/accounts?student=${studentId}`)
    : '/student/account';

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <div className="error-banner">{error}</div>
        <Link to={backLink}>&larr; Back</Link>
      </div>
    );
  }
  if (!account) return <div style={{ padding: 40 }} className="empty-state">Loading…</div>;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 32 }}>
      <div className="no-print" style={{ maxWidth: 700, margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between' }}>
        <Link to={backLink} style={{ color: 'var(--accent)' }}>&larr; Back</Link>
        <button onClick={() => window.print()}>Print</button>
      </div>

      <div className="certificate">
        <div className="certificate-header">
          <h2>St. Michael's Academy</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Statement of Account — School Year {account.school_year}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 24 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{account.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              LRN {account.lrn} · Grade {account.grade_level} — {account.section}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Adviser: {account.adviser_name || '—'}</div>
          </div>
          <span className={`pill ${STATUS_PILL[account.status]}`} style={{ fontSize: 13, padding: '6px 14px' }}>
            {STATUS_LABEL[account.status] || account.status}
          </span>
        </div>

        <h3 style={{ marginTop: 32 }}>Itemized Charges</h3>
        <table>
          <thead><tr><th>Item</th><th>Amount</th></tr></thead>
          <tbody>
            {account.fee_items.map(f => (
              <tr key={f.fee_item_id}><td>{f.fee_type}</td><td>{peso(f.amount)}</td></tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 32, marginTop: 12, fontSize: 14 }}>
          <div>Total Assessed: <strong>{peso(account.total_assessed)}</strong></div>
          <div>Total Paid: <strong>{peso(account.total_paid)}</strong></div>
          <div>Balance: <strong>{peso(account.balance)}</strong></div>
        </div>

        <h3 style={{ marginTop: 32 }}>Payment History</h3>
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

        <div style={{ marginTop: 64, textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
          Printed: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
