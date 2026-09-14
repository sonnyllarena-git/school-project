// Where each role lands after login (or after finishing forced setup) —
// shared by Login.jsx and SetupSecurity.jsx so the two don't drift apart.
export const HOME_BY_ROLE = {
  ADMIN: '/admin',
  REGISTRAR: '/registrar',
  CASHIER: '/cashier',
  TEACHER: '/teacher/attendance',
  STUDENT: '/student',
};
