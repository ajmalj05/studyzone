import {
    LayoutDashboard, Users, ClipboardCheck, BookOpen, FileText, DollarSign, Bell, UserCircle, Calendar, PenLine, MessageSquare
} from "lucide-react";

export const getTeacherMenu = () => [
    { title: "Dashboard", icon: LayoutDashboard, path: "/teacher/dashboard" },
    { title: "My Classes", icon: BookOpen, path: "/teacher/classes" },
    { title: "Attendance", icon: ClipboardCheck, path: "/teacher/attendance" },
    { title: "Student List", icon: Users, path: "/teacher/students" },
    { title: "Add Marks", icon: PenLine, path: "/teacher/marks" },
    { title: "Exam Timetable", icon: Calendar, path: "/teacher/timetable" },
    { title: "Salary Summary", icon: DollarSign, path: "/teacher/salary" },
    { title: "Requests", icon: MessageSquare, path: "/teacher/requests" },
    {
        title: "History",
        icon: FileText,
        path: "#",
        subItems: [
            { title: "Student Attendance", path: "/teacher/history/student-attendance" },
            { title: "Teacher Attendance", path: "/teacher/history/teacher-attendance" }
        ]
    },
    { title: "Notices", icon: Bell, path: "/teacher/notices" },
    { title: "Profile", icon: UserCircle, path: "/teacher/profile" },
];
