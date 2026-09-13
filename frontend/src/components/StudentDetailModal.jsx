import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../lib/api';
import AccountView from './AccountView';

export default function StudentDetailModal({ token, student, onClose }) {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setAccount(null);
    setError('');
    api.getAccount(token, student.student_id).then(setAccount).catch(err => setError(err.message));
  }, [student.student_id, token]);

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
          {error && <div className="error-banner">{error}</div>}
          <AccountView account={account} />
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
