import { Outlet, Navigate, useLocation } from "react-router-dom";
import { AcademicsHubTabs } from "@/components/AcademicsHubTabs";

export default function AcademicsManagement() {
  const { pathname, hash } = useLocation();
  if (pathname === "/admin/academics/classes" && hash === "#batches") {
    return <Navigate to="/admin/academics/batches" replace />;
  }
  return (
    <div className="min-w-0 max-w-full -mx-4 sm:-mx-5">
      <div className="sticky top-0 z-[35] w-full min-w-0 border-b border-border/60 bg-card shadow-sm px-4 sm:px-5">
        <AcademicsHubTabs />
      </div>
      <div className="min-w-0 px-4 sm:px-5 pt-4 sm:pt-5">
        <Outlet />
      </div>
    </div>
  );
}
