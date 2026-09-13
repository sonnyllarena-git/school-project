import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../lib/api';

export default function AddSubjectModal({ token, gradeLevel, section, onClose, onCreated }) {
  const [form, setForm] = useState({ section: section || '', code: '', name: '', schedule_days: '', start_time: '', end_time: '', room: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.createSubject(token, { grade_level: gradeLevel, ...form });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop center" onClick={onClose}>
      <div className="modal-panel wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>Add Subject — Grade {gradeLevel}</h3>
          <button className="ghost icon-btn" onClick={onClose}><XMarkIcon width={20} /></button>
        </div>
        <div className="modal-section">
          <form onSubmit={handleSubmit}>
            {error && <div className="error-banner">{error}</div>}
            <div className="form-row">
              <div>
                <label>Section</label>
                <input required placeholder="e.g. A" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} />
              </div>
              <div>
                <label>Subject Code</label>
                <input required placeholder="e.g. AP1A" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
              </div>
              <div>
                <label>Subject Name</label>
                <input required placeholder="e.g. Araling Panlipunan" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>Schedule Days</label>
                <input placeholder="e.g. Mon/Wed/Fri" value={form.schedule_days} onChange={e => setForm({ ...form, schedule_days: e.target.value })} />
              </div>
              <div>
                <label>Start Time</label>
                <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div>
                <label>End Time</label>
                <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
              </div>
              <div>
                <label>Room</label>
                <input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Subject'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
