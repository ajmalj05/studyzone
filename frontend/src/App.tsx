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
import StaffAttendance from "./pages/StaffAttendance";
import TeacherOfferLetter from "./pages/TeacherOfferLetter";
import TeacherManagement from "./pages/TeacherManagement";
import Fees from "./pages/Fees";
import StudentLedger from "./pages/StudentLedger";
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
import Batches from "./pages/Batches";
import Subjects from "./pages/Subjects";
import Timetable from "./pages/Timetable";
import Reports from "./pages/Reports";
import CommunicationLayout from "./pages/CommunicationLayout";
import CircularPage from "./pages/CircularPage";
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
import StudentAttendanceDetail from "./pages/history/StudentAttendanceDetail";
import TeacherAttendanceHistory from "./pages/history/TeacherAttendanceHistory";
import TeacherAttendanceDetail from "./pages/history/TeacherAttendanceDetail";

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
import TeacherBatchLayout from "./pages/teacher/batch/TeacherBatchLayout";
import TeacherBatchOverview from "./pages/teacher/batch/TeacherBatchOverview";
import TeacherBatchRoster from "./pages/teacher/batch/TeacherBatchRoster";
import TeacherBatchAttendance from "./pages/teacher/batch/TeacherBatchAttendance";
import AdminSalary from "./pages/AdminSalary";
import Expenses from "./pages/Expenses";
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
import AcademicsManagement from "./pages/AcademicsManagement";

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
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/teacher" element={<Login />} />
            <Route path="/teacher-login" element={<Login />} />
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
                <Route path="teachers" element={<TeacherManagement />}>
                  <Route index element={<Navigate to="/admin/teachers/list" replace />} />
                  <Route path="list" element={<Teachers />} />
                  <Route path="offer-letter" element={<TeacherOfferLetter />} />
                  <Route path="assign" element={<ClassTeacherAssign />} />
                  <Route path="attendance" element={<StaffAttendance />} />
                </Route>
                <Route path="payroll" element={<AdminSalary />} />
                <Route path="salary" element={<Navigate to="payroll" replace />} />
                <Route path="fees" element={<Fees />} />
                <Route path="fees/ledger" element={<StudentLedger />} />
                <Route path="attendance" element={<Attendance />} />

                <Route path="academics" element={<AcademicsManagement />}>
                  <Route index element={<Navigate to="/admin/academics/classes" replace />} />
                  <Route path="classes" element={<Classes />} />
                  <Route path="batches" element={<Batches />} />
                  <Route path="subjects" element={<Subjects />} />
                  <Route path="timetable" element={<Timetable />} />
                  <Route path="exams" element={<Exams />} />
                  <Route path="years" element={<AcademicYearPage />} />
                </Route>
                <Route path="classes" element={<Navigate to="/admin/academics/classes" replace />} />
                <Route path="subjects" element={<Navigate to="/admin/academics/subjects" replace />} />
                <Route path="timetable" element={<Navigate to="/admin/academics/timetable" replace />} />
                <Route path="exams" element={<Navigate to="/admin/academics/exams" replace />} />
                <Route path="requests/student" element={<AdminStudentRequests />} />
                <Route path="requests/teacher" element={<Navigate to="/admin/communication/teacher-requests" replace />} />
                <Route path="requests/parent" element={<Navigate to="/admin/communication/parent-requests" replace />} />
                <Route path="history/student-attendance" element={<StudentAttendanceHistory />} />
                <Route path="history/student-attendance/:studentId" element={<StudentAttendanceDetail />} />
                <Route path="history/teacher-attendance" element={<TeacherAttendanceHistory />} />
                <Route path="history/teacher-attendance/:teacherUserId" element={<TeacherAttendanceDetail />} />
                <Route path="enquiry" element={<Enquiry />} />
                <Route path="admission" element={<Admission />} />
                <Route path="admission/application/new" element={<ApplicationFormPage />} />
                <Route path="admission/application/:id" element={<ApplicationFormPage />} />
                <Route path="parents" element={<AdminParentManagement />} />
                <Route path="communication" element={<CommunicationLayout />}>
                  <Route index element={<Navigate to="/admin/communication/circular" replace />} />
                  <Route path="circular" element={<CircularPage />} />
                  <Route path="teacher-requests" element={<AdminTeacherRequests />} />
                  <Route path="parent-requests" element={<AdminParentRequests />} />
                </Route>
                <Route path="reports" element={<Reports />} />
                <Route path="academic-year" element={<Navigate to="/admin/academics/years" replace />} />
                <Route path="year/:yearId" element={<AcademicYearDetailPage />} />
                <Route path="settings" element={<Settings />} />
                <Route path="class-teacher" element={<Navigate to="/admin/teachers/assign" replace />} />
                <Route path="salary-expenses" element={<Navigate to="/admin/payroll" replace />} />
                <Route path="expenses" element={<Expenses />} />
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
              <Route path="/teacher/*" element={<TeacherLayout />}>
                <Route index element={<Navigate to="/teacher/dashboard" replace />} />
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="my-batch" element={<TeacherMyBatch />} />
                <Route path="classes" element={<TeacherClassesAndStudents />} />
                <Route path="batches/:batchId" element={<TeacherBatchLayout />}>
                  <Route index element={<TeacherBatchOverview />} />
                  <Route path="roster" element={<TeacherBatchRoster />} />
                  <Route path="attendance" element={<TeacherBatchAttendance />} />
                </Route>
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
