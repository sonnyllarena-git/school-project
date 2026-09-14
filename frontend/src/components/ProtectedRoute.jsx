import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function ProtectedRoute({ role, children }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  // A temporary-password/just-reset account must finish changing its
  // password and setting up security questions before it can reach
  // anything else — regardless of role.
  if (session.user.must_complete_setup) return <Navigate to="/setup-security" replace />;
  const allowed = Array.isArray(role) ? role : role ? [role] : null;
  if (allowed && !allowed.includes(session.user.role)) return <Navigate to="/login" replace />;
  return children;
}
