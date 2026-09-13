import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminStudents from './pages/admin/AdminStudents';
import AdminImport from './pages/admin/AdminImport';
import AdminExport from './pages/admin/AdminExport';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherGrades from './pages/teacher/TeacherGrades';
import StudentGrades from './pages/student/StudentGrades';
import StudentAttendance from './pages/student/StudentAttendance';
import ParentDashboard from './pages/parent/ParentDashboard';
import StatusPage from './pages/StatusPage';
import LegalDoc from './pages/LegalDoc';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/legal/:doc" element={<LegalDoc />} />

          <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/teachers" element={<ProtectedRoute role="ADMIN"><AdminTeachers /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute role="ADMIN"><AdminStudents /></ProtectedRoute>} />
          <Route path="/admin/import" element={<ProtectedRoute role="ADMIN"><AdminImport /></ProtectedRoute>} />
          <Route path="/admin/export" element={<ProtectedRoute role="ADMIN"><AdminExport /></ProtectedRoute>} />

          <Route path="/teacher/attendance" element={<ProtectedRoute role="TEACHER"><TeacherAttendance /></ProtectedRoute>} />
          <Route path="/teacher/grades" element={<ProtectedRoute role="TEACHER"><TeacherGrades /></ProtectedRoute>} />

          <Route path="/student" element={<ProtectedRoute role="STUDENT"><StudentGrades /></ProtectedRoute>} />
          <Route path="/student/attendance" element={<ProtectedRoute role="STUDENT"><StudentAttendance /></ProtectedRoute>} />

          <Route path="/parent" element={<ProtectedRoute role="PARENT"><ParentDashboard /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
