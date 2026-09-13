const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path, { method = 'GET', body, token, raw } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (raw) {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.text();
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),

  getSchool: token => request('/admin/school', { token }),
  updateSchool: (token, fields) => request('/admin/school', { method: 'PATCH', token, body: fields }),
  listTeachers: token => request('/admin/teachers', { token }),
  createTeacher: (token, data) => request('/admin/teachers', { method: 'POST', token, body: data }),
  getSubjects: token => request('/admin/subjects', { token }),
  createSubject: (token, data) => request('/admin/subjects', { method: 'POST', token, body: data }),
  updateSubjectTeachers: (token, subjectId, teacherIds) =>
    request(`/admin/subjects/${subjectId}/teachers`, { method: 'PUT', token, body: { teacher_ids: teacherIds } }),
  importStudents: (token, csv) => request('/admin/students/import', { method: 'POST', token, body: { csv } }),
  listStudents: token => request('/admin/students', { token }),
  deleteStudent: (token, studentId) => request(`/admin/students/${studentId}`, { method: 'DELETE', token }),
  attendanceReport: token => request('/admin/reports/attendance', { token }),
  gradesReport: token => request('/admin/reports/grades', { token }),
  exportUrl: (table, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return `${BASE_URL}/admin/export/${table}${qs ? `?${qs}` : ''}`;
  },

  myClasses: token => request('/teacher/classes', { token }),
  classRoster: (token, classId) => request(`/teacher/classes/${classId}/roster`, { token }),
  getAttendance: (token, classId, date) => request(`/teacher/classes/${classId}/attendance?date=${date}`, { token }),
  markAttendance: (token, classId, date, records) =>
    request(`/teacher/classes/${classId}/attendance`, { method: 'POST', token, body: { date, records } }),
  enterGrades: (token, classId, subject, grading_period, records) =>
    request(`/teacher/classes/${classId}/grades`, { method: 'POST', token, body: { subject, grading_period, records } }),

  myGrades: token => request('/student/grades', { token }),
  myAttendance: token => request('/student/attendance', { token }),
  myAccount: token => request('/student/account', { token }),
  myEnrollment: token => request('/student/enrollment', { token }),
  myCertificate: token => request('/student/certificate', { token }),
  mySchedule: token => request('/student/schedule', { token }),

  listAccountStudents: token => request('/accounts/students', { token }),
  getAccount: (token, studentId, schoolYear) =>
    request(`/accounts/students/${studentId}${schoolYear ? `?school_year=${schoolYear}` : ''}`, { token }),
  recordPayment: (token, studentId, data) =>
    request(`/accounts/students/${studentId}/payments`, { method: 'POST', token, body: data }),

  getEligibility: (token, studentId) => request(`/enrollment/${studentId}/eligibility`, { token }),
  getEnrollment: (token, studentId) => request(`/enrollment/${studentId}`, { token }),
  verifyEnrollment: (token, studentId) => request(`/enrollment/${studentId}/verify`, { method: 'POST', token }),
  assessEnrollment: (token, studentId) => request(`/enrollment/${studentId}/assess`, { method: 'POST', token }),
  markPrinted: (token, studentId) => request(`/enrollment/${studentId}/mark-printed`, { method: 'POST', token }),
  issueCertificate: (token, studentId) => request(`/enrollment/${studentId}/issue-certificate`, { method: 'POST', token }),
  getCertificate: (token, studentId) => request(`/enrollment/${studentId}/certificate`, { token }),

  getMe: token => request('/me', { token }),
  changePassword: (token, current_password, new_password) =>
    request('/me/password', { method: 'PATCH', token, body: { current_password, new_password } }),
  updateNotifications: (token, prefs) => request('/me/notifications', { method: 'PATCH', token, body: prefs }),
};
