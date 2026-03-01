import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminLayout } from "./layouts/AdminLayout";
import { StudentLayout } from "./layouts/StudentLayout";
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
import Admission from "./pages/Admission";
import Enquiry from "./pages/Enquiry";
import ApplicationFormPage from "./pages/ApplicationFormPage";
import Classes from "./pages/Classes";
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

// History Module
import StudentAttendanceHistory from "./pages/history/StudentAttendanceHistory";
import TeacherAttendanceHistory from "./pages/history/TeacherAttendanceHistory";

// Student Portal
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentRequests from "./pages/student/StudentRequests";
import StudentPlaceholder from "./pages/student/StudentPlaceholder";
import StudentFees from "./pages/student/StudentFees";
import StudentExams from "./pages/student/StudentExams";
import StudentNotices from "./pages/student/StudentNotices";

// Teacher Portal
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherExams from "./pages/teacher/TeacherExams";
import TeacherTimetable from "./pages/teacher/TeacherTimetable";
import TeacherRequests from "./pages/teacher/TeacherRequests";
import TeacherPlaceholder from "./pages/teacher/TeacherPlaceholder";
import TeacherSalary from "./pages/teacher/TeacherSalary";
import TeacherNotices from "./pages/teacher/TeacherNotices";
import AdminSalary from "./pages/AdminSalary";
import AdminParentManagement from "./pages/AdminParentManagement";

// Parent Portal
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentChildren from "./pages/parent/ParentChildren";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentFees from "./pages/parent/ParentFees";
import ParentReports from "./pages/parent/ParentReports";
import ParentTimetable from "./pages/parent/ParentTimetable";
import ParentAnnouncements from "./pages/parent/ParentAnnouncements";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
                <Route path="salary" element={<AdminSalary />} />
                <Route path="fees" element={<Fees />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="exams" element={<Exams />} />
                <Route path="requests/student" element={<AdminStudentRequests />} />
                <Route path="requests/teacher" element={<AdminTeacherRequests />} />
                <Route path="history/student-attendance" element={<StudentAttendanceHistory />} />
                <Route path="history/teacher-attendance" element={<TeacherAttendanceHistory />} />
                <Route path="enquiry" element={<Enquiry />} />
                <Route path="admission" element={<Admission />} />
                <Route path="admission/application/new" element={<ApplicationFormPage />} />
                <Route path="admission/application/:id" element={<ApplicationFormPage />} />
                <Route path="classes" element={<Classes />} />
                <Route path="timetable" element={<Timetable />} />
                <Route path="parents" element={<AdminParentManagement />} />
                <Route path="communication" element={<Communication />} />
                <Route path="reports" element={<Reports />} />
                <Route path="academic-year" element={<AcademicYearPage />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Student Portal */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student" element={<StudentLayout />}>
                <Route index element={<Navigate to="/student/dashboard" replace />} />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="attendance" element={<StudentAttendance />} />
                <Route path="courses" element={<StudentPlaceholder title="My Courses" />} />
                <Route path="fees" element={<StudentFees />} />
                <Route path="exams" element={<StudentExams />} />
                <Route path="requests" element={<StudentRequests />} />
                <Route path="notices" element={<StudentNotices />} />
                <Route path="profile" element={<StudentPlaceholder title="Profile" />} />
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
              </Route>
            </Route>

            {/* Teacher Portal */}
            <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
              <Route path="/teacher" element={<TeacherLayout />}>
                <Route index element={<Navigate to="/teacher/dashboard" replace />} />
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="classes" element={<TeacherPlaceholder title="My Classes" />} />
                <Route path="attendance" element={<TeacherAttendance />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="marks" element={<TeacherExams />} />
                <Route path="timetable" element={<TeacherTimetable />} />
                <Route path="requests" element={<TeacherRequests />} />
                <Route path="history/student-attendance" element={<StudentAttendanceHistory />} />
                <Route path="history/teacher-attendance" element={<TeacherAttendanceHistory />} />
                <Route path="salary" element={<TeacherSalary />} />
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
