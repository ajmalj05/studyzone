import { Outlet } from "react-router-dom";
import { PortalLayout } from "@/layouts/PortalLayout";
import { getParentMenu } from "@/config/parentMenu";
import { DashboardHeader } from "@/components/DashboardHeader";

export function ParentLayout() {
  return (
    <PortalLayout menuItems={getParentMenu()} portalName="Parent Portal">
      <div className="space-y-4">
        <DashboardHeader />
        <Outlet />
      </div>
    </PortalLayout>
  );
}
