import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

const peso = n => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export default function OfficialReceipt() {
  const { session } = useAuth();
  const { studentId, paymentId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getReceipt(session.token, studentId, paymentId).then(setData).catch(err => setError(err.message));
  }, [session, studentId, paymentId]);

  // Reachable from three different places (Accounts, Accounting ledger,
  // Documents), each usually opening this in a new tab — so there's no
  // single "previous page" to go back to. The student's Account page is a
  // sensible landing spot regardless of where the receipt was opened from.
  const backLink = `/admin/accounts?student=${studentId}`;

  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <div className="error-banner">{error}</div>
        <Link to={backLink}>&larr; Back</Link>
      </div>
    );
  }
  if (!data) return <div style={{ padding: 40 }} className="empty-state">Loading…</div>;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 32 }}>
      <div className="no-print" style={{ maxWidth: 700, margin: '0 auto 16px', display: 'flex', justifyContent: 'space-between' }}>
        <Link to={backLink} style={{ color: 'var(--accent)' }}>&larr; Back</Link>
        <button onClick={() => window.print()}>Print</button>
      </div>

      <div className="certificate">
        <div className="certificate-header">
          <h2>{data.school.name}</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.school.address}</div>
        </div>

        <h1 style={{ textAlign: 'center', margin: '32px 0 8px' }}>Official Receipt</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>School Year {data.school_year}</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, fontSize: 13 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{data.student_name}</div>
            <div style={{ color: 'var(--text-muted)' }}>LRN {data.lrn} · Grade {data.grade_level} — {data.section}</div>
          </div>
          <div style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
            Receipt No. {data.payment_id}<br />
            Date: {new Date(data.payment_date).toLocaleDateString()}
          </div>
        </div>

        <table style={{ marginTop: 32 }}>
          <tbody>
            <tr><td>Amount Received</td><td style={{ textAlign: 'right' }}><strong>{peso(data.amount)}</strong></td></tr>
            <tr><td>Method</td><td style={{ textAlign: 'right' }}>{data.method.replace('_', ' ')}</td></tr>
            <tr><td>Reference No.</td><td style={{ textAlign: 'right' }}>{data.reference_no || '—'}</td></tr>
            {data.notes && <tr><td>Notes</td><td style={{ textAlign: 'right' }}>{data.notes}</td></tr>}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, fontSize: 14 }}>
          <div>Total Assessed ({data.school_year}): {peso(data.total_assessed)}</div>
          <div>Paid to Date: {peso(data.paid_to_date)}</div>
          <div>Balance: <strong>{peso(data.balance_after)}</strong></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 64 }}>
          <div>
            <div style={{ borderTop: '1px solid var(--text)', width: 220, paddingTop: 6 }}>{data.recorded_by_name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Received By</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
            Printed: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
