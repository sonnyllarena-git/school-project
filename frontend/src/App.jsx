import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { LanguageProvider } from './lib/i18n';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminSubjects from './pages/admin/AdminSubjects';
import AdminSchedules from './pages/admin/AdminSchedules';
import AdminStudents from './pages/admin/AdminStudents';
import AdminImport from './pages/admin/AdminImport';
import AdminExport from './pages/admin/AdminExport';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminEnrollment from './pages/admin/AdminEnrollment';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherGrades from './pages/teacher/TeacherGrades';
import StudentGrades from './pages/student/StudentGrades';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentAccount from './pages/student/StudentAccount';
import StudentEnrollment from './pages/student/StudentEnrollment';
import StudentSchedule from './pages/student/StudentSchedule';
import StatusPage from './pages/StatusPage';
import LegalDoc from './pages/LegalDoc';
import Certificate from './pages/Certificate';
import StatementOfAccount from './pages/StatementOfAccount';
import ReportCard from './pages/ReportCard';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminAccounting from './pages/admin/AdminAccounting';
import AdminUserManagement from './pages/admin/AdminUserManagement';

export default function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/legal/:doc" element={<LegalDoc />} />

          <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/teachers" element={<ProtectedRoute role="ADMIN"><AdminTeachers /></ProtectedRoute>} />
          <Route path="/admin/subjects" element={<ProtectedRoute role="ADMIN"><AdminSubjects /></ProtectedRoute>} />
          <Route path="/admin/schedules" element={<ProtectedRoute role="ADMIN"><AdminSchedules /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute role="ADMIN"><AdminStudents /></ProtectedRoute>} />
          <Route path="/admin/import" element={<ProtectedRoute role="ADMIN"><AdminImport /></ProtectedRoute>} />
          <Route path="/admin/export" element={<ProtectedRoute role="ADMIN"><AdminExport /></ProtectedRoute>} />
          <Route path="/admin/accounts" element={<ProtectedRoute role="ADMIN"><AdminAccounts /></ProtectedRoute>} />
          <Route path="/admin/accounting" element={<ProtectedRoute role="ADMIN"><AdminAccounting /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="ADMIN"><AdminUserManagement /></ProtectedRoute>} />
          <Route path="/admin/enrollment" element={<ProtectedRoute role="ADMIN"><AdminEnrollment /></ProtectedRoute>} />
          <Route path="/admin/students/:studentId/certificate" element={<ProtectedRoute role="ADMIN"><Certificate source="admin" /></ProtectedRoute>} />
          <Route path="/admin/students/:studentId/soa" element={<ProtectedRoute role="ADMIN"><StatementOfAccount source="admin" /></ProtectedRoute>} />
          <Route path="/admin/students/:studentId/report-card" element={<ProtectedRoute role="ADMIN"><ReportCard source="admin" /></ProtectedRoute>} />
          <Route path="/admin/audit-log" element={<ProtectedRoute role="ADMIN"><AdminAuditLog /></ProtectedRoute>} />

          <Route path="/teacher/attendance" element={<ProtectedRoute role="TEACHER"><TeacherAttendance /></ProtectedRoute>} />
          <Route path="/teacher/grades" element={<ProtectedRoute role="TEACHER"><TeacherGrades /></ProtectedRoute>} />

          <Route path="/student" element={<ProtectedRoute role="STUDENT"><StudentGrades /></ProtectedRoute>} />
          <Route path="/student/attendance" element={<ProtectedRoute role="STUDENT"><StudentAttendance /></ProtectedRoute>} />
          <Route path="/student/account" element={<ProtectedRoute role="STUDENT"><StudentAccount /></ProtectedRoute>} />
          <Route path="/student/enrollment" element={<ProtectedRoute role="STUDENT"><StudentEnrollment /></ProtectedRoute>} />
          <Route path="/student/schedule" element={<ProtectedRoute role="STUDENT"><StudentSchedule /></ProtectedRoute>} />
          <Route path="/student/certificate" element={<ProtectedRoute role="STUDENT"><Certificate source="student" /></ProtectedRoute>} />
          <Route path="/student/report-card" element={<ProtectedRoute role="STUDENT"><ReportCard source="student" /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  );
}
