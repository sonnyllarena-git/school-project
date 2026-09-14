import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

// Single-student requirements status pill — "Requirements Complete" or a
// clickable "Pending Requirement" that jumps to that student's checklist.
// Only Admin/Registrar can see this (requirements.js is gated to those two
// roles), so it silently renders nothing for Cashier/Student/Teacher
// viewers rather than eating a 403.
const CAN_VIEW_ROLES = ['ADMIN', 'REGISTRAR'];

export default function RequirementsBadge({ studentId }) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState(null);
  const canView = CAN_VIEW_ROLES.includes(session.user.role);

  useEffect(() => {
    setChecklist(null);
    if (!canView || !studentId) return;
    api.getStudentRequirements(session.token, studentId).then(r => setChecklist(r.checklist)).catch(() => {});
  }, [session, studentId, canView]);

  if (!canView || !checklist) return null;
  const complete = checklist.every(r => r.status === 'VERIFIED');

  if (complete) {
    return <span className="pill success">Requirements Complete</span>;
  }
  return (
    <button
      style={{
        display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
        border: 'none', cursor: 'pointer', background: 'var(--danger-soft)', color: 'var(--danger)',
      }}
      onClick={() => navigate(`/registrar/requirements?student=${studentId}`)}
    >
      Pending Requirement
    </button>
  );
}
