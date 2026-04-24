import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePageHeaderDispatch } from "@/context/PageHeaderContext";
import { getTeacherAcademicsPageHeader, isTeacherAcademicsPath } from "@/config/teacherMenu";

/** Keeps the shared portal header title in sync with the active Academics tab route. */
export function TeacherAcademicsPageHeaderSync() {
  const { pathname } = useLocation();
  const setConfig = usePageHeaderDispatch();

  useEffect(() => {
    // Batch workspace sets its own title/description in TeacherBatchLayout.
    if (pathname.startsWith("/teacher/batches/")) return;
    if (!isTeacherAcademicsPath(pathname)) return;
    setConfig(getTeacherAcademicsPageHeader(pathname));
  }, [pathname, setConfig]);

  return null;
}
