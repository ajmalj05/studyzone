import { Outlet } from "react-router-dom";
import { PortalLayout } from "@/layouts/PortalLayout";
import { getTeacherMenu } from "@/config/teacherMenu";

export function TeacherLayout() {
  return (
    <PortalLayout menuItems={getTeacherMenu()} portalName="Teacher Portal">
      <Outlet />
    </PortalLayout>
  );
}
