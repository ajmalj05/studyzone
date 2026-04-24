import { Outlet } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { AcademicYearProvider } from "@/context/AcademicYearContext";
import { PageHeaderProvider } from "@/context/PageHeaderContext";
import { AdminPageHeaderBar } from "@/components/AdminPageHeaderBar";

export function AdminLayout() {
  return (
    <AcademicYearProvider>
      <DashboardLayout>
        <PageHeaderProvider>
          <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
            {/* Header sits above the content card, separated by the gap */}
            <div className="shrink-0">
              <AdminPageHeaderBar />
            </div>
            {/* White content card — radius matches AdminPageHeaderBar (rounded-lg) */}
            <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-card border border-border/80 shadow-md shadow-black/5 ring-1 ring-black/[0.04] [overflow:clip]">
              <div
                data-admin-scroll
                className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain"
              >
                <div className="min-h-0 min-w-0 flex-1 px-4 pt-4 pb-10 sm:px-5 sm:pt-5 sm:pb-12">
                  <Outlet />
                </div>
              </div>
            </div>
          </div>
        </PageHeaderProvider>
      </DashboardLayout>
    </AcademicYearProvider>
  );
}
