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
import AdminAccounting from './pages/admin/AdminAccounting';
import AdminAdministration from './pages/admin/AdminAdministration';
import RegistrarDashboard from './pages/registrar/RegistrarDashboard';
import RegistrarRequirements from './pages/registrar/RegistrarRequirements';
import RegistrarDocuments from './pages/registrar/RegistrarDocuments';
import CashierDashboard from './pages/cashier/CashierDashboard';
import Messages from './pages/Messages';
import GoodMoralCertificate from './pages/GoodMoralCertificate';
import HonorableDismissal from './pages/HonorableDismissal';
import TranscriptOfRecords from './pages/TranscriptOfRecords';
import OfficialReceipt from './pages/OfficialReceipt';

const ADMIN_REGISTRAR = ['ADMIN', 'REGISTRAR'];
const ADMIN_CASHIER = ['ADMIN', 'CASHIER'];
const ADMIN_REGISTRAR_CASHIER = ['ADMIN', 'REGISTRAR', 'CASHIER'];
const EVERYONE = ['ADMIN', 'REGISTRAR', 'CASHIER', 'TEACHER', 'STUDENT'];

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
          <Route path="/admin/accounts" element={<ProtectedRoute role={ADMIN_REGISTRAR_CASHIER}><AdminAccounts /></ProtectedRoute>} />
          <Route path="/admin/accounting" element={<ProtectedRoute role={ADMIN_CASHIER}><AdminAccounting /></ProtectedRoute>} />
          <Route path="/admin/administration" element={<ProtectedRoute role="ADMIN"><AdminAdministration /></ProtectedRoute>} />
          <Route path="/admin/enrollment" element={<ProtectedRoute role={ADMIN_REGISTRAR}><AdminEnrollment /></ProtectedRoute>} />
          <Route path="/admin/students/:studentId/certificate" element={<ProtectedRoute role={ADMIN_REGISTRAR}><Certificate source="admin" /></ProtectedRoute>} />
          <Route path="/admin/students/:studentId/soa" element={<ProtectedRoute role={ADMIN_REGISTRAR_CASHIER}><StatementOfAccount source="admin" /></ProtectedRoute>} />
          <Route path="/admin/students/:studentId/report-card" element={<ProtectedRoute role={ADMIN_REGISTRAR}><ReportCard source="admin" /></ProtectedRoute>} />
          <Route path="/admin/students/:studentId/good-moral" element={<ProtectedRoute role={ADMIN_REGISTRAR}><GoodMoralCertificate /></ProtectedRoute>} />
          <Route path="/admin/students/:studentId/honorable-dismissal" element={<ProtectedRoute role={ADMIN_REGISTRAR}><HonorableDismissal /></ProtectedRoute>} />
          <Route path="/admin/students/:studentId/transcript" element={<ProtectedRoute role={ADMIN_REGISTRAR}><TranscriptOfRecords /></ProtectedRoute>} />
          <Route path="/admin/students/:studentId/receipt/:paymentId" element={<ProtectedRoute role={ADMIN_REGISTRAR_CASHIER}><OfficialReceipt /></ProtectedRoute>} />

          <Route path="/registrar" element={<ProtectedRoute role={ADMIN_REGISTRAR}><RegistrarDashboard /></ProtectedRoute>} />
          <Route path="/registrar/requirements" element={<ProtectedRoute role={ADMIN_REGISTRAR}><RegistrarRequirements /></ProtectedRoute>} />
          <Route path="/registrar/documents" element={<ProtectedRoute role={ADMIN_REGISTRAR_CASHIER}><RegistrarDocuments /></ProtectedRoute>} />

          <Route path="/cashier" element={<ProtectedRoute role={ADMIN_CASHIER}><CashierDashboard /></ProtectedRoute>} />

          <Route path="/messages" element={<ProtectedRoute role={EVERYONE}><Messages /></ProtectedRoute>} />

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
