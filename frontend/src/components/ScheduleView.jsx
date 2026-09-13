import { useState } from 'react';
import { formatTime } from '../lib/format';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_LABELS = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' };

export default function ScheduleView({ schedule }) {
  const [dayFilter, setDayFilter] = useState('');

  if (!schedule) return <div className="empty-state">Loading…</div>;
  if (!schedule.subjects?.length) return <div className="empty-state">No schedule set up yet.</div>;

  const filtered = schedule.subjects.filter(s => {
    if (!dayFilter) return true;
    const days = (s.schedule.days || '').split('/').map(d => d.trim());
    return days.includes(dayFilter);
  });

  return (
    <div className="card">
      <h3>Weekly Schedule — Grade {schedule.grade_level}{schedule.section ? ` — ${schedule.section}` : ''}</h3>
      <div className="tabs">
        <button className={!dayFilter ? 'active' : ''} onClick={() => setDayFilter('')}>All Days</button>
        {DAYS.map(d => (
          <button key={d} className={dayFilter === d ? 'active' : ''} onClick={() => setDayFilter(d)}>
            {DAY_LABELS[d]}
          </button>
        ))}
      </div>
      <table>
        <thead><tr><th>Code</th><th>Subject</th><th>Teacher(s)</th><th>Days</th><th>Time</th><th>Room</th></tr></thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={6} className="empty-state">No classes on {DAY_LABELS[dayFilter]}.</td></tr>
          ) : (
            filtered.map(s => (
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
