import { NavLink, useLocation } from "react-router-dom";
import { BookOpen, BookMarked, Library, CalendarDays, FileText, Calendar } from "lucide-react";

const tabBase =
  "relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap py-3 px-2 text-sm font-semibold transition-colors md:text-base";
const tabInactive = "text-slate-500 hover:text-slate-700";
const tabActive = "text-[hsl(194,70%,27%)]";

const base = "/admin/academics";

function HubNavLink({
  to,
  end,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  end?: boolean;
  icon: typeof BookOpen;
  label: string;
  active: boolean;
}) {
  return (
    <NavLink to={to} end={end} className={`${tabBase} ${active ? tabActive : tabInactive}`}>
      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      {label}
      {active ? <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(194,70%,27%)]" /> : null}
    </NavLink>
  );
}

/** In-app tabs for the admin Academics hub (`/admin/academics/*`). */
export function AcademicsHubTabs() {
  const { pathname } = useLocation();

  return (
    <div className="min-w-0 max-w-full bg-card px-1 pb-0">


      <nav
        className="flex min-w-0 max-w-full flex-nowrap items-center gap-x-2 overflow-x-auto overflow-y-hidden py-1 md:gap-x-3"
        aria-label="Academics"
      >
        <HubNavLink
          to={`${base}/classes`}
          end
          icon={BookOpen}
          label="Classes"
          active={pathname === `${base}/classes`}
        />
        <HubNavLink
          to={`${base}/batches`}
          icon={BookMarked}
          label="Batches"
          active={pathname === `${base}/batches`}
        />
        <HubNavLink
          to={`${base}/subjects`}
          icon={Library}
          label="Subjects"
          active={pathname === `${base}/subjects`}
        />
        <HubNavLink
          to={`${base}/timetable`}
          icon={CalendarDays}
          label="Timetable"
          active={pathname === `${base}/timetable`}
        />
        <HubNavLink
          to={`${base}/exams`}
          icon={FileText}
          label="Exams"
          active={pathname === `${base}/exams`}
        />
        <HubNavLink
          to={`${base}/results`}
          icon={FileText}
          label="Results"
          active={pathname === `${base}/results`}
        />
        <HubNavLink
          to={`${base}/years`}
          icon={Calendar}
          label="Academic Years"
          active={pathname === `${base}/years`}
        />
      </nav>
    </div>
  );
}
