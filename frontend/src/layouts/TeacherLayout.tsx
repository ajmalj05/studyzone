import { Outlet } from "react-router-dom";
import { PortalLayout } from "@/layouts/PortalLayout";
import { getTeacherMenu } from "@/config/teacherMenu";
import { TeacherBatchProvider } from "@/context/TeacherBatchContext";

export function TeacherLayout() {
  return (
    <TeacherBatchProvider>
      <PortalLayout menuItems={getTeacherMenu()} portalName="Teacher Portal">
        <Outlet />
      </PortalLayout>
    </TeacherBatchProvider>
  );
}
