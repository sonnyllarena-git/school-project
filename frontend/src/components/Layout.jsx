import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Squares2X2Icon, UserGroupIcon, AcademicCapIcon, ArrowUpTrayIcon, ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon, PencilSquareIcon, ChartBarIcon, CalendarDaysIcon,
  HeartIcon, Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../lib/AuthContext';
import { useOfflineSync } from '../lib/useOfflineSync';
import Footer from './Footer';
import SettingsModal from './SettingsModal';

const NAV_BY_ROLE = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard', end: true, icon: Squares2X2Icon },
    { to: '/admin/teachers', label: 'Teachers', icon: UserGroupIcon },
    { to: '/admin/students', label: 'Students', icon: AcademicCapIcon },
    { to: '/admin/import', label: 'Import Roster', icon: ArrowUpTrayIcon },
    { to: '/admin/export', label: 'Data Export', icon: ArrowDownTrayIcon },
  ],
  TEACHER: [
    { to: '/teacher/attendance', label: 'Attendance', icon: ClipboardDocumentCheckIcon },
    { to: '/teacher/grades', label: 'Grades', icon: PencilSquareIcon },
  ],
  STUDENT: [
    { to: '/student', label: 'My Grades', end: true, icon: ChartBarIcon },
    { to: '/student/attendance', label: 'My Attendance', icon: CalendarDaysIcon },
  ],
  PARENT: [
    { to: '/parent', label: 'My Children', end: true, icon: HeartIcon },
  ],
};

export default function Layout({ title, children }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const role = session?.user?.role;
  const items = NAV_BY_ROLE[role] || [];
  const { isOnline, pending, syncing, syncNow } = useOfflineSync();
  const [settingsOpen, setSettingsOpen] = useState(false);

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
              <item.icon className="nav-icon" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="who">
              <strong>{session?.user?.name}</strong> · {role}
            </div>
            <button className="ghost icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">
              <Cog6ToothIcon width={22} />
            </button>
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
        <Footer />
      </div>
      {settingsOpen && (
        <SettingsModal user={session?.user} onClose={() => setSettingsOpen(false)} onLogout={handleLogout} />
      )}
    </div>
  );
}
