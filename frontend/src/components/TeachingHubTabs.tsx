import { NavLink, useLocation, type To } from "react-router-dom";
import { BookOpen, PenLine, CalendarDays } from "lucide-react";

const tabBase =
  "relative inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap min-h-11 py-2.5 px-3 text-sm font-semibold transition-colors md:text-base md:min-h-0 md:py-3";
const tabInactive = "text-slate-500 hover:text-slate-700";
const tabActive = "text-[hsl(194,70%,27%)]";

function HubNavLink({
  to,
  hash,
  end,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  hash?: string;
  end?: boolean;
  icon: typeof BookOpen;
  label: string;
  active: boolean;
}) {
  const dest: To = hash ? { pathname: to, hash } : to;
  return (
    <NavLink to={dest} end={end} className={`${tabBase} ${active ? tabActive : tabInactive}`}>
      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      {label}
      {active ? <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(194,70%,27%)]" /> : null}
    </NavLink>
  );
}

/** Top-level Academics hub: class list, marks, timetable. Per-class work lives under `/teacher/batches/:id`. */
export function TeachingHubTabs() {
  const { pathname } = useLocation();

  const active = {
    classes: pathname === "/teacher/classes" || pathname.startsWith("/teacher/classes/"),
    batches: pathname.startsWith("/teacher/batches/"),
    marks: pathname === "/teacher/marks" || pathname.startsWith("/teacher/marks/"),
    timetable: pathname === "/teacher/timetable" || pathname.startsWith("/teacher/timetable/"),
  };

  return (
    <div className="sticky top-0 z-10 -mx-1 border-b border-border/60 bg-card px-1 pb-0">
      <nav
        className="flex flex-nowrap items-center gap-x-2 overflow-x-auto py-0 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-x-3 [&::-webkit-scrollbar]:hidden"
        aria-label="Academics"
      >
        <HubNavLink
          to="/teacher/classes"
          icon={BookOpen}
          label="My classes"
          active={active.classes || active.batches}
        />
        <HubNavLink
          to="/teacher/marks"
          icon={PenLine}
          label="Marks & exams"
          active={active.marks}
        />
        <HubNavLink
          to="/teacher/timetable"
          icon={CalendarDays}
          label="Timetable"
          active={active.timetable}
        />
      </nav>
    </div>
  );
}
