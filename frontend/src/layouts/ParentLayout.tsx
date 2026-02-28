import { Outlet } from "react-router-dom";
import { PortalLayout } from "@/layouts/PortalLayout";
import { getParentMenu } from "@/config/parentMenu";

export function ParentLayout() {
  return (
    <PortalLayout menuItems={getParentMenu()} portalName="Parent Portal">
      <Outlet />
    </PortalLayout>
  );
}
