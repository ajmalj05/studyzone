import {
    LayoutDashboard, Users, ClipboardCheck, BookOpen, FileText, DollarSign, Bell, UserCircle, Calendar, PenLine, BookMarked, MessageSquare
} from "lucide-react";

export const getTeacherMenu = () => [
    { title: "Dashboard", icon: LayoutDashboard, path: "/teacher/dashboard" },
    { title: "My Batch", icon: BookMarked, path: "/teacher/my-batch" },
    { title: "Classes & Students", icon: BookOpen, path: "/teacher/classes" },
    { title: "Attendance", icon: ClipboardCheck, path: "/teacher/attendance" },
    { title: "Student List", icon: Users, path: "/teacher/students" },
    { title: "Add Marks", icon: PenLine, path: "/teacher/marks" },
    { title: "Exam Timetable", icon: Calendar, path: "/teacher/timetable" },
    { title: "Payroll", icon: DollarSign, path: "/teacher/payroll" },
    {
        title: "History",
        icon: FileText,
        path: "#",
        subItems: [
            { title: "Student Attendance", path: "/teacher/history/student-attendance" },
            { title: "Teacher Attendance", path: "/teacher/history/teacher-attendance" }
        ]
    },
    { title: "Requests", icon: MessageSquare, path: "/teacher/requests" },
    { title: "Notices", icon: Bell, path: "/teacher/notices" },
    { title: "Profile", icon: UserCircle, path: "/teacher/profile" },
];
