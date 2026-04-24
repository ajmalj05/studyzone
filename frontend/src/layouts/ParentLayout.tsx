import { Outlet } from "react-router-dom";
import { PortalLayout } from "@/layouts/PortalLayout";
import { getParentMenu } from "@/config/parentMenu";
import { AcademicYearProvider } from "@/context/AcademicYearContext";
import { PageHeaderProvider } from "@/context/PageHeaderContext";
import { AdminPageHeaderBar } from "@/components/AdminPageHeaderBar";

export function ParentLayout() {
  return (
    <AcademicYearProvider>
      <PageHeaderProvider>
        <PortalLayout menuItems={getParentMenu()} portalName="Parent Portal">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 sm:gap-6">
            <AdminPageHeaderBar />
            <div className="flex-1 rounded-xl bg-card border border-border/40 shadow-sm overflow-hidden p-5">
              <Outlet />
            </div>
          </div>
        </PortalLayout>
      </PageHeaderProvider>
    </AcademicYearProvider>
  );
}
