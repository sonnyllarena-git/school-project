import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../lib/api';
import { formatTime } from '../lib/format';

export default function SubjectDetailModal({ token, subject, allTeachers, onClose, onChanged }) {
  const [addTeacherId, setAddTeacherId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const unassigned = allTeachers.filter(t => !subject.teachers.some(x => x.teacher_id === t.teacher_id));
  const schedule = subject.schedule || {};
  const timeRange = schedule.start_time && schedule.end_time
    ? `${formatTime(schedule.start_time)} – ${formatTime(schedule.end_time)}`
    : null;

  async function save(nextTeacherIds) {
    setBusy(true);
    setError('');
    try {
      await api.updateSubjectTeachers(token, subject.subject_id, nextTeacherIds);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function removeTeacher(teacherId) {
    save(subject.teachers.filter(t => t.teacher_id !== teacherId).map(t => t.teacher_id));
  }

  function addTeacher() {
    if (!addTeacherId) return;
    save([...subject.teachers.map(t => t.teacher_id), addTeacherId]);
    setAddTeacherId('');
  }

  return (
    <div className="modal-backdrop center" onClick={onClose}>
      <div className="modal-panel wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>{subject.name}</h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Code {subject.code} · Grade {subject.grade_level}
            </div>
          </div>
          <button className="ghost icon-btn" onClick={onClose}><XMarkIcon width={20} /></button>
        </div>

        <div className="modal-section">
          <div className="form-row" style={{ marginBottom: 0 }}>
            <div>
              <label>Schedule</label>
              <div>{schedule.days || '—'}{timeRange ? ` · ${timeRange}` : ''}</div>
            </div>
            <div>
              <label>Room</label>
              <div>{schedule.room || '—'}</div>
            </div>
          </div>
        </div>

        <div className="modal-section">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Assigned Teacher(s)</div>
          {error && <div className="error-banner" style={{ fontSize: 12 }}>{error}</div>}
          {subject.teachers.length === 0 ? (
            <div className="empty-state">No teacher assigned yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {subject.teachers.map(t => (
                <div key={t.teacher_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{t.name}</span>
                  <button className="ghost" disabled={busy} style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => removeTeacher(t.teacher_id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {unassigned.length > 0 && (
            <div className="form-row" style={{ marginBottom: 0, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label>Assign another teacher</label>
                <select value={addTeacherId} onChange={e => setAddTeacherId(e.target.value)}>
                  <option value="">Select a teacher…</option>
                  {unassigned.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.name}</option>)}
                </select>
              </div>
              <button disabled={!addTeacherId || busy} onClick={addTeacher}>Assign</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
