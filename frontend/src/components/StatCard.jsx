export default function StatCard({ label, value }) {
  return (
    <div className="card stat-card">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
