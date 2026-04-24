import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Users, UserCheck, UserRoundCog, CalendarCheck } from "lucide-react";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap py-3 px-2 text-sm font-semibold transition-colors md:text-base ${
    isActive ? "text-[hsl(194,70%,27%)]" : "text-slate-500 hover:text-slate-700"
  }`;

function getHeaderConfig(pathname: string) {
  const isListPage = pathname === "/admin/teachers" || pathname === "/admin/teachers/list";
  
  if (isListPage) {
    return {
      title: "Teachers",
      description: "Teacher list, profiles, and staff attendance.",
    };
  }
  
  if (pathname.includes("/offer-letter")) {
    return {
      title: "Offer Letter",
      description: "Create, save, and print offer letters; create teacher accounts from accepted letters.",
    };
  }
  
  if (pathname.includes("/assign")) {
    return {
      title: "Class Teacher Assign",
      description: "Assign class teachers to batches for the current academic year.",
    };
  }
  
  if (pathname.includes("/attendance")) {
    return {
      title: "Staff Attendance",
      description: "Mark and manage staff attendance.",
    };
  }
  
  return {
    title: "Teachers",
    description: "Teacher list, profiles, and staff attendance.",
  };
}

export default function TeacherManagement() {
  const location = useLocation();
  const headerConfig = getHeaderConfig(location.pathname);
  
  usePageHeaderConfigEffect(headerConfig, [location.pathname]);

  return (
    <div className="flex flex-col gap-5 sm:gap-6 -mx-4 sm:-mx-5">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-card/95 px-4 sm:px-5 pb-0 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <nav className="flex flex-wrap items-center gap-2 md:gap-6" aria-label="Teacher admin">
          <NavLink to="/admin/teachers/list" className={navLinkClass} end>
            {({ isActive }) => (
              <>
                <Users className="h-4 w-4 shrink-0 opacity-80" />
                Teacher list
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(194,70%,27%)]" />}
              </>
            )}
          </NavLink>
          <NavLink to="/admin/teachers/offer-letter" className={navLinkClass}>
            {({ isActive }) => (
              <>
                <UserCheck className="h-4 w-4 shrink-0 opacity-80" />
                Offer letter
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(194,70%,27%)]" />}
              </>
            )}
          </NavLink>
          <NavLink to="/admin/teachers/assign" className={navLinkClass}>
            {({ isActive }) => (
              <>
                <UserRoundCog className="h-4 w-4 shrink-0 opacity-80" />
                Class teacher assign
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(194,70%,27%)]" />}
              </>
            )}
          </NavLink>
          <NavLink to="/admin/teachers/attendance" className={navLinkClass}>
            {({ isActive }) => (
              <>
                <CalendarCheck className="h-4 w-4 shrink-0 opacity-80" />
                Staff attendance
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(194,70%,27%)]" />}
              </>
            )}
          </NavLink>
        </nav>
      </div>

      <div className="min-w-0 px-4 sm:px-5">
        <Outlet />
      </div>
    </div>
  );
}
