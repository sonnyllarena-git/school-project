import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../lib/api';
import AccountView from './AccountView';
import ScheduleView from './ScheduleView';
import GradesView from './GradesView';

export default function StudentDetailModal({ token, student, onClose }) {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [grades, setGrades] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setAccount(null);
    setError('');
    api.getAccount(token, student.student_id).then(setAccount).catch(err => setError(err.message));
  }, [student.student_id, token]);

  useEffect(() => {
    setGrades(null);
    api.getStudentGrades(token, student.student_id).then(setGrades).catch(err => setError(err.message));
  }, [student.student_id, token]);

  useEffect(() => {
    setSchedule(null);
    api.getSubjects(token).then(grades => {
      const gradeEntry = grades.find(g => g.grade_level === student.grade_level);
      const sectionEntry = gradeEntry?.sections?.find(s => s.section === student.section);
      setSchedule({
        grade_level: student.grade_level,
        section: student.section,
        subjects: (sectionEntry?.subjects || []).map(s => ({
          code: s.code, name: s.name, schedule: s.schedule, teachers: s.teachers.map(t => t.name),
        })),
      });
    }).catch(err => setError(err.message));
  }, [student.student_id, student.grade_level, student.section, token]);

  return (
    <div className="modal-backdrop center" onClick={onClose}>
      <div className="modal-panel wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>{student.name}</h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>LRN {student.lrn}</div>
          </div>
          <button className="ghost icon-btn" onClick={onClose}><XMarkIcon width={20} /></button>
        </div>

        <div className="modal-section">
          <div className="form-row" style={{ marginBottom: 0 }}>
            <div>
              <label>Date of Birth</label>
              <div>{student.date_of_birth || '—'}</div>
            </div>
            <div>
              <label>Gender</label>
              <div>{student.gender || '—'}</div>
            </div>
            <div>
              <label>Roster Status</label>
              <div>{student.status || '—'}</div>
            </div>
          </div>
        </div>

        <div className="modal-section">
          <h3 style={{ marginTop: 0 }}>Guardian &amp; Emergency Contact</h3>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <div>
              <label>Guardian</label>
              <div>{student.guardian_name ? `${student.guardian_name} (${student.guardian_relationship || 'Guardian'})` : '—'}</div>
            </div>
            <div>
              <label>Guardian Phone</label>
              <div>{student.guardian_phone || '—'}</div>
            </div>
            <div>
              <label>Guardian Email</label>
              <div>{student.guardian_email || '—'}</div>
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 0, marginTop: 12 }}>
            <div>
              <label>Emergency Contact</label>
              <div>{student.emergency_contact_name || '—'}</div>
            </div>
            <div>
              <label>Emergency Contact Phone</label>
              <div>{student.emergency_contact_phone || '—'}</div>
            </div>
          </div>
        </div>

        <div className="modal-section">
          {error && <div className="error-banner">{error}</div>}
          {grades && grades.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button className="secondary" onClick={() => window.open(`/admin/students/${student.student_id}/report-card`, '_blank')}>
                Print Report Card
              </button>
            </div>
          )}
          <GradesView grades={grades} />
        </div>

        <div className="modal-section">
          {account && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button className="secondary" onClick={() => window.open(`/admin/students/${student.student_id}/soa`, '_blank')}>
                Print Preview (SOA)
              </button>
            </div>
          )}
          <AccountView account={account} />
        </div>

        <div className="modal-section">
          <ScheduleView schedule={schedule} />
        </div>

        <div className="modal-section">
          <button
            className="secondary"
            style={{ width: '100%' }}
            onClick={() => navigate(`/admin/accounts?student=${student.student_id}`)}
          >
            Open Full Account (record a payment)
          </button>
        </div>
      </div>
    </div>
  );
}
