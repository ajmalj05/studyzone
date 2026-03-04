import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, GraduationCap, DollarSign, FileText,
  UserCheck, MessageSquare, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  ClipboardList, CalendarDays, BookOpen, Calendar, Library, UserRoundCog,
} from "lucide-react";
import { LogoutModal } from "@/components/LogoutModal";
import logoImg from "@/assets/logo.png";
import { useAuth } from "@/context/AuthContext";

export type MenuItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  subItems?: { title: string; path: string }[];
};

const menuItems: MenuItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { title: "Enquiry", icon: MessageSquare, path: "/admin/enquiry" },
  { title: "Admission", icon: ClipboardList, path: "/admin/admission" },
  { title: "Academic Year", icon: Calendar, path: "/admin/academic-year" },
  { title: "Students", icon: Users, path: "/admin/students" },
  { title: "Classes", icon: BookOpen, path: "/admin/classes" },
  { title: "Subjects", icon: Library, path: "/admin/subjects" },
  { title: "Teachers", icon: GraduationCap, path: "/admin/teachers" },
  { title: "Class Teacher Assign", icon: UserRoundCog, path: "/admin/class-teacher" },
  { title: "Payroll", icon: DollarSign, path: "/admin/payroll" },
  { title: "Fees", icon: DollarSign, path: "/admin/fees" },
  { title: "Timetable", icon: CalendarDays, path: "/admin/timetable" },
  { title: "Exams & Results", icon: FileText, path: "/admin/exams" },
  { title: "Student Requests", icon: MessageSquare, path: "/admin/requests/student" },
  { title: "Teacher Requests", icon: MessageSquare, path: "/admin/requests/teacher" },
  { title: "Parent Requests", icon: MessageSquare, path: "/admin/requests/parent" },
  {
    title: "History",
    icon: FileText,
    path: "#",
    subItems: [
      { title: "Student Attendance", path: "/admin/history/student-attendance" },
      { title: "Teacher Attendance", path: "/admin/history/teacher-attendance" }
    ]
  },
  { title: "Parent Portal", icon: UserCheck, path: "/admin/parents" },
  { title: "Communication", icon: MessageSquare, path: "/admin/communication" },
  { title: "Reports", icon: BarChart3, path: "/admin/reports" },
  { title: "Settings", icon: Settings, path: "/admin/settings" },
];

export interface AppSidebarContentProps {
  onNavigate?: () => void;
  isInDrawer?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  expandedMenu?: string | null;
  onExpandedMenuChange?: (key: string | null) => void;
}

export function AppSidebarContent({
  onNavigate,
  isInDrawer = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  expandedMenu: controlledExpanded,
  onExpandedMenuChange,
}: AppSidebarContentProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState<string | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const collapsed = isInDrawer ? false : (controlledCollapsed ?? internalCollapsed);
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;
  const expandedMenu = controlledExpanded ?? internalExpanded;
  const setExpandedMenu = onExpandedMenuChange ?? setInternalExpanded;

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <>
      <div className="flex h-full flex-col gradient-sidebar">
        <div className="flex items-center gap-3 px-5 py-6">
          <img src={logoImg} alt="Studyzone" className="h-10 w-10 flex-shrink-0 object-contain" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="text-lg font-bold text-sidebar-foreground whitespace-nowrap overflow-hidden">
                Studyzone
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav className="sidebar-nav-scroll flex-1 space-y-1 px-3 overflow-y-auto">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path || (item.subItems && item.subItems.some(sub => location.pathname === sub.path));
            const isExpanded = expandedMenu === item.title;

            return (
              <div key={item.title}>
                <motion.button
                  initial={isInDrawer ? false : { x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: isInDrawer ? 0 : index * 0.05, duration: 0.3 }}
                  onClick={() => {
                    if (item.subItems) {
                      if (collapsed) setCollapsed(false);
                      setExpandedMenu(isExpanded ? null : item.title);
                    } else {
                      handleNav(item.path);
                    }
                  }}
                  className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 min-h-[44px] ${isActive ? "bg-sidebar-primary/20 text-sidebar-foreground shadow-glow backdrop-blur-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-primary/10 hover:text-sidebar-foreground"}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-sidebar-foreground" : ""}`} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="whitespace-nowrap overflow-hidden">{item.title}</motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {!collapsed && item.subItems && (
                    <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                  )}
                </motion.button>

                <AnimatePresence>
                  {!collapsed && isExpanded && item.subItems && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-1 flex flex-col gap-1 pl-11 pr-2">
                        {item.subItems.map(subItem => (
                          <button
                            key={subItem.path}
                            onClick={() => handleNav(subItem.path)}
                            className={`flex w-full items-center rounded-lg px-3 py-2 text-sm min-h-[44px] transition-all duration-200 ${location.pathname === subItem.path ? "bg-sidebar-primary/20 text-sidebar-foreground font-semibold" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-primary/10"}`}
                          >
                            {subItem.title}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <button onClick={() => setShowLogout(true)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] text-sidebar-foreground/70 transition-all hover:bg-sidebar-primary/10 hover:text-sidebar-foreground">
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">Logout</motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {!isInDrawer && (
          <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full bg-card text-foreground shadow-card transition-all hover:shadow-card-hover">
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        )}
      </div>

      <LogoutModal
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={() => {
          logout();
          navigate("/admin-login", { replace: true });
          onNavigate?.();
        }}
      />
    </>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`gradient-sidebar fixed left-0 top-0 z-50 flex h-screen flex-col transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}
    >
      <AppSidebarContent
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        expandedMenu={expandedMenu}
        onExpandedMenuChange={setExpandedMenu}
      />
    </motion.aside>
  );
}
