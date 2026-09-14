import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

const peso = n => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export default function CashierDashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [outstanding, setOutstanding] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAccountingSummary(session.token).then(setSummary).catch(err => setError(err.message));
    api.listAccountStudents(session.token)
      .then(list => setOutstanding(list.filter(s => s.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 10)))
      .catch(err => setError(err.message));
  }, [session]);

  return (
    <Layout title="Cashier Dashboard">
      {error && <div className="error-banner">{error}</div>}

      {summary && (
        <div className="grid grid-4" style={{ marginBottom: 20 }}>
          <StatCard label="Total Assessed" value={peso(summary.total_assessed)} />
          <StatCard label="Total Collected" value={peso(summary.total_paid)} />
          <StatCard label="Outstanding" value={peso(summary.total_outstanding)} />
          <StatCard label="Collection Rate" value={summary.collection_rate_pct === null ? '—' : `${summary.collection_rate_pct}%`} />
        </div>
      )}

      <div className="card">
        <h3>Top Outstanding Balances</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
          The 10 largest balances still owed. See every student on the Accounting tab.
        </p>
        {outstanding.length === 0 ? (
          <div className="empty-state">No outstanding balances.</div>
        ) : (
          <table>
            <thead><tr><th>Student</th><th>Grade</th><th>Balance</th><th></th></tr></thead>
            <tbody>
              {outstanding.map(s => (
                <tr key={s.student_id}>
                  <td>{s.name} ({s.lrn})</td>
                  <td>Grade {s.grade_level} — {s.section}</td>
                  <td>{peso(s.balance)}</td>
                  <td>
                    <button className="secondary" style={{ fontSize: 13, padding: '4px 10px' }} onClick={() => navigate(`/admin/accounts?student=${s.student_id}`)}>
                      Record Payment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
