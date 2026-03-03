import { Outlet } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { AcademicYearProvider } from "@/context/AcademicYearContext";

export function AdminLayout() {
  return (
    <AcademicYearProvider>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </AcademicYearProvider>
  );
}
