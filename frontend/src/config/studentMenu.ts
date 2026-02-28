import {
  LayoutDashboard,
  ClipboardCheck,
  BookOpen,
  DollarSign,
  FileText,
  Bell,
  UserCircle,
  MessageSquare,
} from "lucide-react";

export const getStudentMenu = () => [
  { title: "Dashboard", icon: LayoutDashboard, path: "/student/dashboard" },
  { title: "Attendance", icon: ClipboardCheck, path: "/student/attendance" },
  { title: "My Courses", icon: BookOpen, path: "/student/courses" },
  { title: "Fees Status", icon: DollarSign, path: "/student/fees" },
  { title: "Exam Results", icon: FileText, path: "/student/exams" },
  { title: "Requests", icon: MessageSquare, path: "/student/requests" },
  { title: "Notices", icon: Bell, path: "/student/notices" },
  { title: "Profile", icon: UserCircle, path: "/student/profile" },
];
