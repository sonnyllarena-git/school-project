import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';
import { STATUS_LABEL, STATUS_PILL } from '../../lib/accountStatus';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const METHODS = ['CASH', 'GCASH', 'BANK_TRANSFER'];
const peso = n => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export default function AdminAccounting() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [filters, setFilters] = useState({ school_year: '', method: '', from: '', to: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.listAccountStudents(session.token).then(setStudents).catch(err => setError(err.message));
  }, [session]);

  useEffect(() => {
    api.getLedger(session.token, filters).then(setLedger).catch(err => setError(err.message));
    api.getAccountingSummary(session.token, { school_year: filters.school_year }).then(setSummary).catch(err => setError(err.message));
  }, [session, filters]);

  // Every school year seen in the ledger so far, for the filter dropdown —
  // avoids hardcoding "2025-2026"/"2026-2027" here as new years show up.
  const schoolYears = useMemo(
    () => [...new Set(ledger.map(p => p.school_year))].sort().reverse(),
    [ledger]
  );

  const searchTerm = search.trim().toLowerCase();
  const filteredLedger = ledger.filter(p =>
    !searchTerm || p.student_name.toLowerCase().includes(searchTerm) || p.lrn.includes(searchTerm)
  );

  const outstanding = students
    .filter(s => s.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  async function handleExport(table) {
    setError('');
    setDownloading(table);
    try {
      const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
      const res = await fetch(`${BASE_URL}/admin/export/${table}${qs ? `?${qs}` : ''}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <Layout title="Accounting">
      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Filters</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
          Applies to the summary, ledger, and CSV exports below. Outstanding Balances always reflects each student's current standing.
        </p>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div>
            <label>School Year</label>
            <select value={filters.school_year} onChange={e => setFilters({ ...filters, school_year: e.target.value })}>
              <option value="">All Years</option>
              {schoolYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label>Method</label>
            <select value={filters.method} onChange={e => setFilters({ ...filters, method: e.target.value })}>
              <option value="">All Methods</option>
              {METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label>From</label>
            <input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div>
            <label>To</label>
            <input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
          </div>
        </div>
      </div>

      <h3>Collections Summary</h3>
      {summary && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <StatCard label="Total Assessed" value={peso(summary.total_assessed)} />
            <StatCard label="Total Collected" value={peso(summary.total_paid)} />
            <StatCard label="Outstanding" value={peso(summary.total_outstanding)} />
            <StatCard label="Collection Rate" value={summary.collection_rate_pct === null ? '—' : `${summary.collection_rate_pct}%`} />
          </div>
          <div className="grid grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <h3>Collected by Method</h3>
              {summary.by_method.length === 0 ? (
                <div className="empty-state">No payments in range.</div>
              ) : (
                <table>
                  <thead><tr><th>Method</th><th>Total</th></tr></thead>
                  <tbody>
                    {summary.by_method.map(m => (
                      <tr key={m.method}><td>{m.method.replace('_', ' ')}</td><td>{peso(m.total)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="card">
              <h3>Assessed by Fee Type</h3>
              {summary.by_fee_type.length === 0 ? (
                <div className="empty-state">No fee items in range.</div>
              ) : (
                <table>
                  <thead><tr><th>Fee Type</th><th>Total</th></tr></thead>
                  <tbody>
                    {summary.by_fee_type.map(f => (
                      <tr key={f.fee_type}><td>{f.fee_type}</td><td>{peso(f.total)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Outstanding Balances ({outstanding.length})</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>
          Every student who still owes money, by their own current school year, sorted highest balance first.
        </p>
        {outstanding.length === 0 ? (
          <div className="empty-state">No outstanding balances.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Student</th><th>Grade</th><th>School Year</th><th>Balance</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {outstanding.map(s => (
                  <tr key={s.student_id}>
                    <td>{s.name} ({s.lrn})</td>
                    <td>Grade {s.grade_level} — {s.section}</td>
                    <td>{s.school_year}</td>
                    <td>{peso(s.balance)}</td>
                    <td><span className={`pill ${STATUS_PILL[s.status]}`}>{STATUS_LABEL[s.status] || s.status}</span></td>
                    <td>
                      <button className="secondary" style={{ fontSize: 13, padding: '4px 10px' }} onClick={() => navigate(`/admin/accounts?student=${s.student_id}`)}>
                        View Account
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3>Payments Ledger ({filteredLedger.length})</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: -8 }}>Every payment recorded, most recent first.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="secondary" disabled={downloading === 'payments'} onClick={() => handleExport('payments')}>
              {downloading === 'payments' ? 'Downloading…' : 'Export Payments CSV'}
            </button>
            <button className="secondary" disabled={downloading === 'fee_items'} onClick={() => handleExport('fee_items')}>
              {downloading === 'fee_items' ? 'Downloading…' : 'Export Fee Items CSV'}
            </button>
          </div>
        </div>
        <div style={{ maxWidth: 320, marginBottom: 16 }}>
          <label>Search</label>
          <input placeholder="Name or LRN…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {filteredLedger.length === 0 ? (
          <div className="empty-state">No payments match these filters.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Student</th><th>Grade</th><th>School Year</th><th>Amount</th>
                  <th>Method</th><th>Reference</th><th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.map(p => (
                  <tr key={p.payment_id}>
                    <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="ghost"
                        style={{ padding: 0, textDecoration: 'underline', color: 'var(--accent)' }}
                        onClick={() => navigate(`/admin/accounts?student=${p.student_id}`)}
                      >
                        {p.student_name} ({p.lrn})
                      </button>
                    </td>
                    <td>{p.grade_level ? `Grade ${p.grade_level} — ${p.section}` : '—'}</td>
                    <td>{p.school_year}</td>
                    <td>{peso(p.amount)}</td>
                    <td>{p.method.replace('_', ' ')}</td>
                    <td>{p.reference_no || '—'}</td>
                    <td>{p.recorded_by_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
