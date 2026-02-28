import { Outlet } from "react-router-dom";
import { PortalLayout } from "@/layouts/PortalLayout";
import { getStudentMenu } from "@/config/studentMenu";

export function StudentLayout() {
  return (
    <PortalLayout menuItems={getStudentMenu()} portalName="Student Portal">
      <Outlet />
    </PortalLayout>
  );
}
