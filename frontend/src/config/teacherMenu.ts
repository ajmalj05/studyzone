import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Bell,
  UserCircle,
  MessageSquare,
  GraduationCap,
} from "lucide-react";
import type { PageHeaderConfig } from "@/context/PageHeaderContext";

/** Routes that show the horizontal Academics hub tabs in the teacher portal. */
const TEACHER_ACADEMICS_PREFIXES = [
  "/teacher/classes",
  "/teacher/batches",
  "/teacher/marks",
  "/teacher/timetable",
] as const;

export function isTeacherAcademicsPath(pathname: string): boolean {
  return TEACHER_ACADEMICS_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Title/description for the top bar; labels match TeachingHubTabs. */
export function getTeacherAcademicsPageHeader(pathname: string): PageHeaderConfig {
  const match = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

  if (match("/teacher/classes")) {
    return {
      title: "My classes",
      description: "Your assigned classes — open one for roster, attendance, and marks.",
    };
  }
  if (match("/teacher/marks")) {
    return {
      title: "Marks & exams",
      description:
        "Choose a class, then an exam. Class teachers see all subjects; subject teachers only their timetable subjects.",
    };
  }
  if (match("/teacher/timetable")) {
    return {
      title: "Class timetable",
      description: "Your teaching periods by day, from the published school timetable.",
    };
  }
  return { title: "Academics", description: "Teaching hub." };
}

export const getTeacherMenu = () => [
  { title: "Dashboard", icon: LayoutDashboard, path: "/teacher/dashboard" },
  {
    title: "Academics",
    icon: GraduationCap,
    path: "/teacher/classes",
    activeMatch: isTeacherAcademicsPath,
  },
  { title: "Payroll", icon: DollarSign, path: "/teacher/payroll" },
  {
    title: "History",
    icon: FileText,
    path: "#",
    subItems: [
      { title: "Student Attendance", path: "/teacher/history/student-attendance" },
      { title: "Teacher Attendance", path: "/teacher/history/teacher-attendance" },
    ],
  },
  { title: "Requests", icon: MessageSquare, path: "/teacher/requests" },
  { title: "Notices", icon: Bell, path: "/teacher/notices" },
  { title: "Profile", icon: UserCircle, path: "/teacher/profile" },
];
