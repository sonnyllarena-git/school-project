// Lightweight i18n for English/Tagalog. Scoped honestly: navigation, login,
// settings, and common buttons are translated. Page-specific content (table
// headers, form labels deep inside e.g. Accounts/Enrollment) is NOT — that
// would mean translating every string in the app, a much bigger effort than
// "add a language toggle." Untranslated strings just render in English.
import { createContext, useContext, useEffect, useState } from 'react';

const STRINGS = {
  en: {
    dashboard: 'Dashboard', teachers: 'Teachers', subjects: 'Subjects', schedules: 'Schedules', students: 'Students',
    import_roster: 'Import Roster', data_export: 'Data Export', accounts: 'Accounts', accounting: 'Accounting',
    user_management: 'User Management',
    enrollment: 'Enrollment', attendance: 'Attendance', grades: 'Grades', audit_log: 'Audit Log',
    my_grades: 'My Grades', my_attendance: 'My Attendance', my_schedule: 'My Schedule', my_account: 'My Account',
    school_portal_login: 'School Portal Login', email: 'Email', password: 'Password',
    log_in: 'Log In', signing_in: 'Signing in…', log_out: 'Log out',
    settings: 'Settings', dark_mode: 'Dark mode',
    dark_mode_desc: 'Switch between light and dark themes',
    language: 'Language', change_password: 'Change Password',
    current_password: 'Current Password', new_password: 'New Password',
    save: 'Save', cancel: 'Cancel', saving: 'Saving…',
    notifications: 'Notifications', email_notifications: 'Email notifications',
    sms_notifications: 'SMS notifications',
    notifications_note: 'Preference only — not yet wired to an actual email/SMS provider.',
  },
  tl: {
    dashboard: 'Dashboard', teachers: 'Mga Guro', subjects: 'Mga Asignatura', schedules: 'Mga Iskedyul', students: 'Mga Mag-aaral',
    import_roster: 'I-import ang Listahan', data_export: 'I-export ang Data', accounts: 'Mga Account', accounting: 'Accounting',
    user_management: 'Pamamahala ng User',
    enrollment: 'Pagpapatala', attendance: 'Pagdalo', grades: 'Mga Marka', audit_log: 'Audit Log',
    my_grades: 'Aking mga Marka', my_attendance: 'Aking Pagdalo', my_schedule: 'Aking Iskedyul', my_account: 'Aking Account',
    school_portal_login: 'Pag-login sa School Portal', email: 'Email', password: 'Password',
    log_in: 'Mag-log In', signing_in: 'Nag-lo-log in…', log_out: 'Mag-log Out',
    settings: 'Mga Setting', dark_mode: 'Madilim na Mode',
    dark_mode_desc: 'Lumipat sa pagitan ng maliwanag at madilim na tema',
    language: 'Wika', change_password: 'Palitan ang Password',
    current_password: 'Kasalukuyang Password', new_password: 'Bagong Password',
    save: 'I-save', cancel: 'Kanselahin', saving: 'Sine-save…',
    notifications: 'Mga Abiso', email_notifications: 'Abiso sa Email',
    sms_notifications: 'Abiso sa SMS',
    notifications_note: 'Kagustuhan lang — hindi pa konektado sa aktwal na email/SMS provider.',
  },
};

const LanguageContext = createContext(null);
const KEY = 'language';

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(KEY) || 'en');

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(next) {
    localStorage.setItem(KEY, next);
    setLangState(next);
  }

  function t(key) {
    return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
