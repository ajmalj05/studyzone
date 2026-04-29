import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { TeacherCurrentBatchProvider, useTeacherCurrentBatch, batchDisplayName } from "@/context/TeacherCurrentBatchContext";
import { usePageHeaderDispatch } from "@/context/PageHeaderContext";

const subTabBase =
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2.5 min-h-10 text-sm font-semibold transition-colors sm:min-h-0 sm:py-2";
const subInactive = "text-muted-foreground hover:bg-muted/80 hover:text-foreground";
const subActive = "bg-primary/10 text-primary";

function TeacherBatchHeaderTitle() {
  const batch = useTeacherCurrentBatch();
  const location = useLocation();
  const setConfig = usePageHeaderDispatch();

  useEffect(() => {
    const path = location.pathname;
    let section = "Overview";
    if (path.endsWith("/roster")) section = "Roster";
    else if (path.endsWith("/attendance")) section = "Student attendance";
    setConfig({
      title: batchDisplayName(batch),
      description: section,
    });
    return () => setConfig({});
  }, [batch, location.pathname, setConfig]);

  return null;
}

function TeacherBatchNav() {
  const { batchId } = useParams<{ batchId: string }>();
  const batch = useTeacherCurrentBatch();
  const base = `/teacher/batches/${batchId}`;

  return (
    <div className="sticky top-0 z-[5] -mx-1 border-b border-border bg-background/95 px-1 pb-0 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav
        className="flex flex-nowrap gap-1 overflow-x-auto py-2 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Class sections"
      >
        <NavLink to={base} end className={({ isActive }) => `${subTabBase} ${isActive ? subActive : subInactive}`}>
          Overview
        </NavLink>
        <NavLink
          to={`${base}/roster`}
          className={({ isActive }) => `${subTabBase} ${isActive ? subActive : subInactive}`}
        >
          Roster
        </NavLink>
        {batch.isClassTeacher ? (
          <NavLink
            to={`${base}/attendance`}
            className={({ isActive }) => `${subTabBase} ${isActive ? subActive : subInactive}`}
          >
            Attendance
          </NavLink>
        ) : null}
      </nav>
    </div>
  );
}

export default function TeacherBatchLayout() {
  const { batchId } = useParams<{ batchId: string }>();
  if (!batchId) {
    return null;
  }

  return (
    <TeacherCurrentBatchProvider batchId={batchId}>
      <TeacherBatchHeaderTitle />
      <TeacherBatchNav />
      <div className="mt-4 min-h-0">
        <Outlet />
      </div>
    </TeacherCurrentBatchProvider>
  );
}
