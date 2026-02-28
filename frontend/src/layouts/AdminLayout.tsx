import { Outlet } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export function AdminLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
