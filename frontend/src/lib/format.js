// Shared by AdminSubjects, SubjectDetailModal, and ScheduleView so a "HH:MM"
// time string (from Postgres TIME columns) renders the same way everywhere.
export function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':');
  const hour = Number(h);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${suffix}`;
}
