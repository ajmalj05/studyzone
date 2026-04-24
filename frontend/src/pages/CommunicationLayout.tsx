import { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { usePageHeaderConfigEffect } from "@/context/PageHeaderContext";

/** Shared layout for admin communication routes (no in-page tabs; navigation is in the sidebar). */
export default function CommunicationLayout() {
  const { pathname } = useLocation();

  const { title, description } = useMemo(() => {
    if (pathname.includes("/teacher-requests")) {
      return {
        title: "Teacher requests",
        description: "Review and respond to teacher requests.",
      };
    }
    if (pathname.includes("/parent-requests")) {
      return {
        title: "Parent requests",
        description: "Manage and respond to parent inquiries.",
      };
    }
    return {
      title: "Circular",
      description: "Circulars, announcements, and notice board.",
    };
  }, [pathname]);

  usePageHeaderConfigEffect({ title, description }, [title, description]);

  return (
    <div className="min-w-0 max-w-full">
      <Outlet />
    </div>
  );
}
