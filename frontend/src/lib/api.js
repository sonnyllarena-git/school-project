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
  importStudents: (token, csv) => request('/admin/students/import', { method: 'POST', token, body: { csv } }),
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

  myChildren: token => request('/parent/children', { token }),
  childGrades: (token, studentId) => request(`/parent/children/${studentId}/grades`, { token }),
  childAttendance: (token, studentId) => request(`/parent/children/${studentId}/attendance`, { token }),
};
