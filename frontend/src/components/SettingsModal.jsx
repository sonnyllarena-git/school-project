import { useEffect, useState } from 'react';
import { XMarkIcon, MoonIcon, SunIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../lib/useTheme';
import { useLanguage } from '../lib/i18n';
import { api } from '../lib/api';

export default function SettingsModal({ user, token, onClose, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyError, setNotifyError] = useState('');
  const [notifySaved, setNotifySaved] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getMe(token).then(me => {
      setNotifyEmail(me.notify_email);
      setNotifySms(me.notify_sms);
    }).catch(() => {});
  }, [token]);

  async function saveNotifications(next) {
    setNotifyError('');
    setNotifySaved(false);
    try {
      await api.updateNotifications(token, next);
      setNotifySaved(true);
    } catch (err) {
      setNotifyError(err.message);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwError('');
    setPwSaved(false);
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError("New password and confirmation don't match.");
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(token, pwForm.current_password, pwForm.new_password);
      setPwSaved(true);
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>{t('settings')}</h3>
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
            <div style={{ fontWeight: 600, fontSize: 14 }}>{t('dark_mode')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('dark_mode_desc')}</div>
          </div>
          <button className="secondary icon-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <MoonIcon width={18} /> : <SunIcon width={18} />}
          </button>
        </div>

        <div className="modal-section settings-row">
          <div style={{ fontWeight: 600, fontSize: 14 }}>{t('language')}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className={lang === 'en' ? 'secondary' : 'ghost'} style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setLang('en')}>EN</button>
            <button className={lang === 'tl' ? 'secondary' : 'ghost'} style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setLang('tl')}>TL</button>
          </div>
        </div>

        <div className="modal-section">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{t('notifications')}</div>
          {notifyError && <div className="error-banner" style={{ fontSize: 12 }}>{notifyError}</div>}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, fontSize: 13, marginBottom: 6 }}>
            <input
              type="checkbox" checked={notifyEmail}
              onChange={e => { setNotifyEmail(e.target.checked); saveNotifications({ notify_email: e.target.checked }); }}
            />
            {t('email_notifications')}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, fontSize: 13 }}>
            <input
              type="checkbox" checked={notifySms}
              onChange={e => { setNotifySms(e.target.checked); saveNotifications({ notify_sms: e.target.checked }); }}
            />
            {t('sms_notifications')}
          </label>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            {t('notifications_note')} {notifySaved && '✓'}
          </div>
        </div>

        <div className="modal-section">
          <button className="ghost" style={{ width: '100%', textAlign: 'left', fontWeight: 600, fontSize: 14 }} onClick={() => setShowPasswordForm(!showPasswordForm)}>
            {t('change_password')}
          </button>
          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} style={{ marginTop: 10 }}>
              {pwError && <div className="error-banner" style={{ fontSize: 12 }}>{pwError}</div>}
              {pwSaved && <div className="error-banner" style={{ fontSize: 12, background: 'var(--success-soft)', color: 'var(--success)' }}>{t('save')} ✓</div>}
              <input
                type="password" placeholder={t('current_password')} required
                value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
                style={{ width: '100%', marginBottom: 8 }}
              />
              <input
                type="password" placeholder={t('new_password')} required minLength={8}
                value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                style={{ width: '100%', marginBottom: 8 }}
              />
              <input
                type="password" placeholder={t('new_password')} required minLength={8}
                value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                style={{ width: '100%', marginBottom: 10 }}
              />
              <button type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? t('saving') : t('save')}</button>
            </form>
          )}
        </div>

        <div className="modal-section">
          <button className="danger" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={onLogout}>
            <ArrowRightOnRectangleIcon width={18} /> {t('log_out')}
          </button>
        </div>
      </div>
    </div>
  );
}
