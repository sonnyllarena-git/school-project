import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Squares2X2Icon, UserGroupIcon, AcademicCapIcon, ArrowUpTrayIcon, ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon, PencilSquareIcon, ChartBarIcon, CalendarDaysIcon,
  Cog6ToothIcon, BanknotesIcon, ArrowUpCircleIcon, BookOpenIcon, ClockIcon,
  DocumentMagnifyingGlassIcon, CalculatorIcon, UsersIcon,
  ClipboardDocumentListIcon, DocumentTextIcon, ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../lib/AuthContext';
import { useOfflineSync } from '../lib/useOfflineSync';
import { useLanguage } from '../lib/i18n';
import Footer from './Footer';
import SettingsModal from './SettingsModal';

const NAV_BY_ROLE = {
  ADMIN: [
    { to: '/admin', labelKey: 'dashboard', end: true, icon: Squares2X2Icon },
    { to: '/admin/users', labelKey: 'user_management', icon: UsersIcon },
    { to: '/admin/teachers', labelKey: 'teachers', icon: UserGroupIcon },
    { to: '/admin/subjects', labelKey: 'subjects', icon: BookOpenIcon },
    { to: '/admin/schedules', labelKey: 'schedules', icon: ClockIcon },
    { to: '/admin/students', labelKey: 'students', icon: AcademicCapIcon },
    { to: '/admin/import', labelKey: 'import_roster', icon: ArrowUpTrayIcon },
    { to: '/admin/export', labelKey: 'data_export', icon: ArrowDownTrayIcon },
    { to: '/admin/accounts', labelKey: 'accounts', icon: BanknotesIcon },
    { to: '/admin/accounting', labelKey: 'accounting', icon: CalculatorIcon },
    { to: '/admin/enrollment', labelKey: 'enrollment', icon: ArrowUpCircleIcon },
    { to: '/registrar/requirements', labelKey: 'requirements', icon: ClipboardDocumentListIcon },
    { to: '/registrar/documents', labelKey: 'documents', icon: DocumentTextIcon },
    { to: '/admin/audit-log', labelKey: 'audit_log', icon: DocumentMagnifyingGlassIcon },
    { to: '/messages', labelKey: 'messages', icon: ChatBubbleLeftRightIcon },
  ],
  REGISTRAR: [
    { to: '/registrar', labelKey: 'dashboard', end: true, icon: Squares2X2Icon },
    { to: '/admin/enrollment', labelKey: 'enrollment', icon: ArrowUpCircleIcon },
    { to: '/registrar/requirements', labelKey: 'requirements', icon: ClipboardDocumentListIcon },
    { to: '/registrar/documents', labelKey: 'documents', icon: DocumentTextIcon },
    { to: '/messages', labelKey: 'messages', icon: ChatBubbleLeftRightIcon },
  ],
  CASHIER: [
    { to: '/cashier', labelKey: 'dashboard', end: true, icon: Squares2X2Icon },
    { to: '/admin/accounts', labelKey: 'accounts', icon: BanknotesIcon },
    { to: '/admin/accounting', labelKey: 'accounting', icon: CalculatorIcon },
    { to: '/registrar/documents', labelKey: 'documents', icon: DocumentTextIcon },
    { to: '/messages', labelKey: 'messages', icon: ChatBubbleLeftRightIcon },
  ],
  TEACHER: [
    { to: '/teacher/attendance', labelKey: 'attendance', icon: ClipboardDocumentCheckIcon },
    { to: '/teacher/grades', labelKey: 'grades', icon: PencilSquareIcon },
    { to: '/messages', labelKey: 'messages', icon: ChatBubbleLeftRightIcon },
  ],
  STUDENT: [
    { to: '/student', labelKey: 'my_grades', end: true, icon: ChartBarIcon },
    { to: '/student/attendance', labelKey: 'my_attendance', icon: CalendarDaysIcon },
    { to: '/student/schedule', labelKey: 'my_schedule', icon: BookOpenIcon },
    { to: '/student/account', labelKey: 'my_account', icon: BanknotesIcon },
    { to: '/student/enrollment', labelKey: 'enrollment', icon: ArrowUpCircleIcon },
    { to: '/messages', labelKey: 'messages', icon: ChatBubbleLeftRightIcon },
  ],
};

export default function Layout({ title, children }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const role = session?.user?.role;
  const items = NAV_BY_ROLE[role] || [];
  const { isOnline, pending, syncing, syncNow } = useOfflineSync();
  const { t } = useLanguage();
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
              {t(item.labelKey)}
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
            <button className="ghost icon-btn" onClick={() => setSettingsOpen(true)} title={t('settings')}>
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
        <SettingsModal user={session?.user} token={session?.token} onClose={() => setSettingsOpen(false)} onLogout={handleLogout} />
      )}
    </div>
  );
}
