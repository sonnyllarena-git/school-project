import StatCard from './StatCard';

export default function AttendanceTable({ records }) {
  if (!records) return <div className="empty-state">Loading…</div>;
  if (records.length === 0) return <div className="empty-state">No attendance recorded yet.</div>;

  const present = records.filter(r => r.status === 'PRESENT').length;
  const pct = Math.round((present / records.length) * 1000) / 10;

  return (
    <>
      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <StatCard label="Days Recorded" value={records.length} />
        <StatCard label="Days Present" value={present} />
        <StatCard label="Attendance Rate" value={`${pct}%`} />
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Date</th><th>Status</th><th>Time In</th></tr></thead>
          <tbody>
            {records.map(r => (
              <tr key={r.date}>
                <td>{new Date(r.date).toLocaleDateString()}</td>
                <td><span className={`pill ${r.status.toLowerCase()}`}>{r.status}</span></td>
                <td>{r.time_in || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
