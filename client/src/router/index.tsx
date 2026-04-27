import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { RoleLayout } from '../components/layout/RoleLayout';
import { AdminDashboard } from '../pages/admin/Dashboard';
import { Users } from '../pages/admin/Users';
import { AuditLogs } from '../pages/admin/AuditLogs';
import { SchoolSetup } from '../pages/admin/SchoolSetup';
import { AdminExams } from '../pages/admin/AdminExams';
import { Quizzes } from '../pages/teacher/Quizzes';
import { QuizBuilder } from '../pages/teacher/QuizBuilder';
import { QuizResults } from '../pages/teacher/QuizResults';
import { TeacherStudents } from '../pages/teacher/TeacherStudents';
import { TeacherBlacklist } from '../pages/teacher/Blacklist';
import { ExamLobby } from '../pages/student/ExamLobby';
import { ExamShell } from '../pages/student/ExamShell';
import { StudentResults } from '../pages/student/Results';

// Placeholder components for Stage 3+
const Placeholder = ({ name }: { name: string }) => (
  <div className="p-12 text-center">
    <h2 className="text-2xl font-bold mb-2">{name}</h2>
    <p className="text-muted-foreground">This page is under construction.</p>
  </div>
);

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Admin Routes */}
      <Route element={<RoleLayout allowedRoles={['ADMIN']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/exams" element={<AdminExams />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/school" element={<SchoolSetup />} />
      </Route>

      {/* Teacher Routes */}
      <Route element={<RoleLayout allowedRoles={['TEACHER']} />}>
        <Route path="/teacher/quizzes" element={<Quizzes />} />
        <Route path="/teacher/quizzes/:id" element={<QuizBuilder />} />
        <Route path="/teacher/quizzes/:id/results" element={<QuizResults />} />
        <Route path="/teacher/students" element={<TeacherStudents />} />
        <Route path="/teacher/blacklist" element={<TeacherBlacklist />} />
      </Route>

      {/* Student Routes */}
      <Route element={<RoleLayout allowedRoles={['STUDENT']} />}>
        <Route path="/student/dashboard" element={<ExamLobby />} />
        <Route path="/student/results" element={<StudentResults />} />
      </Route>

      {/* Exam Shell without Sidebar, but still check if authenticated */}
      <Route path="/student/exam/:id" element={<ExamShell />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
