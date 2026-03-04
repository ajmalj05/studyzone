import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./layouts/AdminLayout";
import { TeacherLayout } from "./layouts/TeacherLayout";
import { ParentLayout } from "./layouts/ParentLayout";

import Index from "./pages/Index";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Fees from "./pages/Fees";
import Attendance from "./pages/Attendance";
import Exams from "./pages/Exams";
import PlaceholderPage from "./pages/PlaceholderPage";
import Settings from "./pages/Settings";
import AcademicYearPage from "./pages/AcademicYearPage";
import AcademicYearDetailPage from "./pages/AcademicYearDetailPage";
import Admission from "./pages/Admission";
import Enquiry from "./pages/Enquiry";
import ApplicationFormPage from "./pages/ApplicationFormPage";
import Classes from "./pages/Classes";
import Subjects from "./pages/Subjects";
import Timetable from "./pages/Timetable";
import Reports from "./pages/Reports";
import Communication from "./pages/Communication";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import VerifyProfile from "./pages/VerifyProfile";
import VerifyOtp from "./pages/VerifyOtp";
import SetupAccount from "./pages/SetupAccount";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminLogin from "./pages/AdminLogin";
import AdminStudentRequests from "./pages/AdminStudentRequests";
import AdminTeacherRequests from "./pages/AdminTeacherRequests";
import AdminParentRequests from "./pages/AdminParentRequests";

// History Module
import StudentAttendanceHistory from "./pages/history/StudentAttendanceHistory";
import TeacherAttendanceHistory from "./pages/history/TeacherAttendanceHistory";

// Teacher Portal
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherExams from "./pages/teacher/TeacherExams";
import TeacherTimetable from "./pages/teacher/TeacherTimetable";
import TeacherRequests from "./pages/teacher/TeacherRequests";
import TeacherPlaceholder from "./pages/teacher/TeacherPlaceholder";
import TeacherSalary from "./pages/teacher/TeacherSalary";
import TeacherMyBatch from "./pages/teacher/TeacherMyBatch";
import TeacherNotices from "./pages/teacher/TeacherNotices";
import TeacherClassesAndStudents from "./pages/teacher/TeacherClassesAndStudents";
import AdminSalary from "./pages/AdminSalary";
import AdminSalaryAndExpenses from "./pages/AdminSalaryAndExpenses";
import AdminParentManagement from "./pages/AdminParentManagement";

// Parent Portal
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentChildren from "./pages/parent/ParentChildren";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentFees from "./pages/parent/ParentFees";
import ParentReports from "./pages/parent/ParentReports";
import ParentTimetable from "./pages/parent/ParentTimetable";
import ParentAnnouncements from "./pages/parent/ParentAnnouncements";
import ParentRequests from "./pages/parent/ParentRequests";
import ClassTeacherAssign from "./pages/ClassTeacherAssign";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            {/* Auth & Setup */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-profile" element={<VerifyProfile />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/setup-account" element={<SetupAccount />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* Admin Dashboard */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Index />} />
                <Route path="students" element={<Students />} />
                <Route path="teachers" element={<Teachers />} />
                <Route path="payroll" element={<AdminSalary />} />
                <Route path="salary" element={<Navigate to="payroll" replace />} />
                <Route path="fees" element={<Fees />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="exams" element={<Exams />} />
                <Route path="requests/student" element={<AdminStudentRequests />} />
                <Route path="requests/teacher" element={<AdminTeacherRequests />} />
                <Route path="requests/parent" element={<AdminParentRequests />} />
                <Route path="history/student-attendance" element={<StudentAttendanceHistory />} />
                <Route path="history/teacher-attendance" element={<TeacherAttendanceHistory />} />
                <Route path="enquiry" element={<Enquiry />} />
                <Route path="admission" element={<Admission />} />
                <Route path="admission/application/new" element={<ApplicationFormPage />} />
                <Route path="admission/application/:id" element={<ApplicationFormPage />} />
                <Route path="classes" element={<Classes />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="timetable" element={<Timetable />} />
                <Route path="parents" element={<AdminParentManagement />} />
                <Route path="communication" element={<Communication />} />
                <Route path="reports" element={<Reports />} />
                <Route path="academic-year" element={<AcademicYearPage />} />
                <Route path="year/:yearId" element={<AcademicYearDetailPage />} />
                <Route path="settings" element={<Settings />} />
                <Route path="class-teacher" element={<ClassTeacherAssign />} />
                <Route path="salary-expenses" element={<AdminSalaryAndExpenses />} />
              </Route>
            </Route>

            {/* Parent Portal */}
            <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
              <Route path="/parent" element={<ParentLayout />}>
                <Route index element={<Navigate to="/parent/dashboard" replace />} />
                <Route path="dashboard" element={<ParentDashboard />} />
                <Route path="children" element={<ParentChildren />} />
                <Route path="attendance" element={<ParentAttendance />} />
                <Route path="fees" element={<ParentFees />} />
                <Route path="reports" element={<ParentReports />} />
                <Route path="timetable" element={<ParentTimetable />} />
                <Route path="announcements" element={<ParentAnnouncements />} />
                <Route path="requests" element={<ParentRequests />} />
              </Route>
            </Route>

            {/* Teacher Portal */}
            <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
              <Route path="/teacher" element={<TeacherLayout />}>
                <Route index element={<Navigate to="/teacher/dashboard" replace />} />
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="my-batch" element={<TeacherMyBatch />} />
                <Route path="classes" element={<TeacherClassesAndStudents />} />
                <Route path="attendance" element={<TeacherAttendance />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="marks" element={<TeacherExams />} />
                <Route path="timetable" element={<TeacherTimetable />} />
                <Route path="requests" element={<TeacherRequests />} />
                <Route path="history/student-attendance" element={<StudentAttendanceHistory />} />
                <Route path="history/teacher-attendance" element={<TeacherAttendanceHistory />} />
                <Route path="payroll" element={<TeacherSalary />} />
                <Route path="salary" element={<Navigate to="payroll" replace />} />
                <Route path="notices" element={<TeacherNotices />} />
                <Route path="profile" element={<TeacherPlaceholder title="Profile" />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
