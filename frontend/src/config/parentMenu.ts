import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  DollarSign,
  FileText,
  Calendar,
  Bell,
  MessageSquare,
} from "lucide-react";

export const getParentMenu = () => [
  { title: "Dashboard", icon: LayoutDashboard, path: "/parent/dashboard" },
  { title: "My Children", icon: Users, path: "/parent/children" },
  { title: "Attendance", icon: ClipboardCheck, path: "/parent/attendance" },
  { title: "Fees", icon: DollarSign, path: "/parent/fees" },
  { title: "Report Cards", icon: FileText, path: "/parent/reports" },
  { title: "Timetable", icon: Calendar, path: "/parent/timetable" },
  { title: "Announcements", icon: Bell, path: "/parent/announcements" },
  { title: "Report Issue", icon: MessageSquare, path: "/parent/requests" },
];
