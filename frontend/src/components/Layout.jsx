import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useOfflineSync } from '../lib/useOfflineSync';

const NAV_BY_ROLE = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/teachers', label: 'Teachers' },
    { to: '/admin/students', label: 'Students' },
    { to: '/admin/import', label: 'Import Roster' },
    { to: '/admin/export', label: 'Data Export' },
  ],
  TEACHER: [
    { to: '/teacher/attendance', label: 'Attendance' },
    { to: '/teacher/grades', label: 'Grades' },
  ],
  STUDENT: [
    { to: '/student', label: 'My Grades', end: true },
    { to: '/student/attendance', label: 'My Attendance' },
  ],
  PARENT: [
    { to: '/parent', label: 'My Children', end: true },
  ],
};

export default function Layout({ title, children }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const role = session?.user?.role;
  const items = NAV_BY_ROLE[role] || [];
  const { isOnline, pending, syncing, syncNow } = useOfflineSync();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="badge">SM</span>
          St. Michael's Academy
        </div>
        <nav>
          {items.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="nav-link logout" onClick={handleLogout}>Log out</button>
      </aside>
      <div className="main">
        <header className="topbar">
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          <div className="who">
            <strong>{session?.user?.name}</strong> · {role}
          </div>
        </header>
        {(!isOnline || pending > 0) && (
          <div className="offline-banner">
            {!isOnline ? "You're offline — changes will save locally and sync automatically." : `${pending} change${pending === 1 ? '' : 's'} waiting to sync.`}
            {isOnline && pending > 0 && (
              <button className="secondary" onClick={syncNow} disabled={syncing} style={{ marginLeft: 12 }}>
                {syncing ? 'Syncing…' : 'Sync now'}
              </button>
            )}
          </div>
        )}
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
