import { NavLink, useLocation } from "react-router-dom";
import { BookOpen, BookMarked, Library, CalendarDays, FileText, ClipboardCheck, BarChart3, ShieldCheck } from "lucide-react";

const tabBase =
  "relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap py-3 px-3 text-[12px] font-semibold transition-colors";
const tabInactive = "text-slate-500 hover:text-slate-700";
const tabActive = "text-teal-700";

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
  const { pathname, search } = useLocation();
  const isMarksEntryTab = pathname === `${base}/results` && !search.includes("mode=published");
  const isPublishedResultsTab = pathname === `${base}/results` && search.includes("mode=published");

  return (
    <div className="min-w-0 max-w-full bg-white px-1 pb-0">
      <nav
        className="flex min-w-0 max-w-full flex-nowrap items-center gap-x-1 overflow-x-auto overflow-y-hidden py-1.5 md:gap-x-2"
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
          label="Exam Schedule"
          active={pathname === `${base}/exams`}
        />
        <HubNavLink
          to={`${base}/results`}
          icon={ClipboardCheck}
          label="Marks Entry"
          active={isMarksEntryTab}
        />
        <HubNavLink
          to={`${base}/results?mode=published`}
          icon={BarChart3}
          label="Results"
          active={isPublishedResultsTab}
        />
        <HubNavLink
          to={`${base}/approvals`}
          icon={ShieldCheck}
          label="Approvals"
          active={pathname === `${base}/approvals`}
        />
      </nav>
    </div>
  );
}
