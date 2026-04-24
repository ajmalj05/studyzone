import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrentAcademicYearBadge } from "@/components/CurrentAcademicYearBadge";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { usePageHeaderConfig } from "@/context/PageHeaderContext";
import { useAuth } from "@/context/AuthContext";
import { useMobileMenu } from "@/context/MobileMenuContext";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  students: "Students",
  teachers: "Teachers",
  list: "Staff",
  "offer-letter": "Offer letter",
  assign: "Class assignment",
  fees: "Fee management",
  ledger: "Student ledger",
  attendance: "Attendance",
  academics: "Academics",
  classes: "Classes",
  batches: "Batches",
  subjects: "Subjects",
  timetable: "Timetable",
  exams: "Exams",
  marks: "Marks & exams",
  years: "Academic years",
  parents: "Parent management",
  payroll: "Payroll",
  "salary-expenses": "Salary & expenses",
  expenses: "Expenses",
  enquiry: "Enquiry",
  admission: "Admission",
  communication: "Communication",
  circular: "Circulars",
  "teacher-requests": "Teacher requests",
  "parent-requests": "Parent requests",
  reports: "Reports",
  settings: "Settings",
  requests: "Requests",
  student: "Students",
  history: "History",
  "student-attendance": "Student attendance",
  "teacher-attendance": "Teacher attendance",
  year: "Academic year",
  application: "Application",
  "my-classes": "My classes",
  roster: "Roster",
  announcements: "Announcements",
};

// Portal prefixes that are stripped from breadcrumb (treated as root "Dashboard")
const PORTAL_PREFIXES = new Set(["admin", "teacher", "parent"]);

function getInitials(name: string | undefined, role: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    return name.slice(0, 2).toUpperCase();
  }
  return role === "teacher" ? "TR" : role === "parent" ? "PA" : "AK";
}

function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  // The first segment is the portal prefix (admin / teacher / parent)
  const portalPrefix = segments[0] && PORTAL_PREFIXES.has(segments[0]) ? segments[0] : null;

  // Strip portal prefix and uuid-like dynamic segments
  const meaningful = segments
    .filter((s) => !PORTAL_PREFIXES.has(s))
    .filter((s) => !/^[0-9a-f-]{8,}$/i.test(s));

  if (meaningful.length === 0) {
    return <span className="text-sm font-semibold text-foreground">Dashboard</span>;
  }

  const base = portalPrefix ? `/${portalPrefix}/` : "/";

  return (
    <nav className="flex items-center gap-1 flex-wrap">
      <Link to={`${base}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        Dashboard
      </Link>
      {meaningful.map((seg, i) => {
        const isLast = i === meaningful.length - 1;
        const label = ROUTE_LABELS[seg] ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const href = base + meaningful.slice(0, i + 1).join("/");

        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            {isLast ? (
              <span className="text-sm font-semibold text-foreground">{label}</span>
            ) : (
              <Link to={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function AdminPageHeaderBar() {
  const { showYearBadge = true, toolbarEnd } = usePageHeaderConfig();
  const { user } = useAuth();
  const mobileMenu = useMobileMenu();
  const role = user?.role ?? "admin";
  const initials = getInitials(user?.name, role);

  return (
    <div className="shrink-0 rounded-lg border border-border/80 bg-card/95 px-3 py-3 shadow-md shadow-black/5 ring-1 ring-black/[0.04] backdrop-blur-md supports-[backdrop-filter]:bg-card/90 dark:ring-white/[0.06] dark:shadow-black/40 sm:px-5 sm:py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 sm:gap-x-8">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {mobileMenu?.isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 min-h-[44px] min-w-[44px] md:hidden"
              onClick={mobileMenu.openMobileMenu}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Breadcrumb />
        </div>

        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-x-4 gap-y-2 sm:gap-x-5">
          {toolbarEnd}
          {showYearBadge ? <CurrentAcademicYearBadge /> : null}
          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationDropdown />
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full gradient-primary"
              aria-hidden
            >
              <span className="text-xs font-semibold text-primary-foreground">{initials}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
