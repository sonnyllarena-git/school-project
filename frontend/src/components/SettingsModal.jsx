import { XMarkIcon, MoonIcon, SunIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../lib/useTheme';

export default function SettingsModal({ user, onClose, onLogout }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>Settings</h3>
          <button className="ghost icon-btn" onClick={onClose}><XMarkIcon width={20} /></button>
        </div>

        <div className="modal-section">
          <div className="settings-user">
            <div className="badge" style={{ width: 40, height: 40, fontSize: 15 }}>
              {user?.name?.[0] || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.role}</div>
            </div>
          </div>
        </div>

        <div className="modal-section settings-row">
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Dark mode</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Switch between light and dark themes</div>
          </div>
          <button className="secondary icon-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <MoonIcon width={18} /> : <SunIcon width={18} />}
          </button>
        </div>

        <div className="modal-section">
          <button className="danger" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={onLogout}>
            <ArrowRightOnRectangleIcon width={18} /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}
