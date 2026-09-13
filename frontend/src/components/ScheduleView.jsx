import { formatTime } from '../lib/format';

export default function ScheduleView({ schedule }) {
  if (!schedule) return <div className="empty-state">Loading…</div>;
  if (!schedule.subjects?.length) return <div className="empty-state">No schedule set up yet.</div>;

  return (
    <div className="card">
      <h3>Weekly Schedule — Grade {schedule.grade_level}{schedule.section ? ` — ${schedule.section}` : ''}</h3>
      <table>
        <thead><tr><th>Code</th><th>Subject</th><th>Teacher(s)</th><th>Days</th><th>Time</th><th>Room</th></tr></thead>
        <tbody>
          {schedule.subjects.map(s => (
            <tr key={s.code}>
              <td>{s.code}</td>
              <td>{s.name}</td>
              <td>{s.teachers.length ? s.teachers.join(', ') : '—'}</td>
              <td>{s.schedule.days || '—'}</td>
              <td>
                {s.schedule.start_time && s.schedule.end_time
                  ? `${formatTime(s.schedule.start_time)} – ${formatTime(s.schedule.end_time)}`
                  : '—'}
              </td>
              <td>{s.schedule.room || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
