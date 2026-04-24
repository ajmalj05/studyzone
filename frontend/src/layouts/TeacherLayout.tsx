import { Outlet, useLocation } from "react-router-dom";
import { PortalLayout } from "@/layouts/PortalLayout";
import { getTeacherMenu, isTeacherAcademicsPath } from "@/config/teacherMenu";
import { TeacherBatchProvider } from "@/context/TeacherBatchContext";
import { AcademicYearProvider } from "@/context/AcademicYearContext";
import { PageHeaderProvider } from "@/context/PageHeaderContext";
import { AdminPageHeaderBar } from "@/components/AdminPageHeaderBar";
import { TeachingHubTabs } from "@/components/TeachingHubTabs";
import { TeacherAcademicsPageHeaderSync } from "@/components/TeacherAcademicsPageHeaderSync";

export function TeacherLayout() {
  const { pathname } = useLocation();
  const showAcademicsHub = isTeacherAcademicsPath(pathname);

  return (
    <AcademicYearProvider>
      <PageHeaderProvider>
        <TeacherBatchProvider>
          <PortalLayout menuItems={getTeacherMenu()} portalName="Teacher Portal">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
              <AdminPageHeaderBar />
              <TeacherAcademicsPageHeaderSync />
              <div className="flex-1 rounded-[var(--radius)] bg-card border border-border/60 shadow-sm overflow-hidden">
                {showAcademicsHub ? <TeachingHubTabs /> : null}
                <div className="p-5">
                  <Outlet />
                </div>
              </div>
            </div>
          </PortalLayout>
        </TeacherBatchProvider>
      </PageHeaderProvider>
    </AcademicYearProvider>
  );
}
