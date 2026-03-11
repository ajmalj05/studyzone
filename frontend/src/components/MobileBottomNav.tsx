import { NavLink } from "react-router-dom";
import { LucideIcon, LayoutDashboard, Users, ClipboardCheck, DollarSign, FileText } from "lucide-react";

export type MobileBottomNavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
};

const adminNavItems: MobileBottomNavItem[] = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/students", label: "Students", icon: Users },
  { path: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
  { path: "/admin/fees", label: "Fees", icon: DollarSign },
  { path: "/admin/exams", label: "Exams", icon: FileText },
];

export function getAdminBottomNavItems(): MobileBottomNavItem[] {
  return adminNavItems;
}

export function getPortalBottomNavItems(
  menuItems: { path: string; title: string; icon: LucideIcon }[]
): MobileBottomNavItem[] {
  return menuItems
    .filter((m) => m.path !== "#")
    .slice(0, 5)
    .map((m) => ({ path: m.path, label: m.title, icon: m.icon }));
}

interface MobileBottomNavProps {
  items: MobileBottomNavItem[];
}

export function MobileBottomNav({ items }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile navigation"
    >
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-2 px-3 min-w-0 flex-1 text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="truncate max-w-full">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
