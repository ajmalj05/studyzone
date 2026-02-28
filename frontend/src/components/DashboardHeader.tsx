import { NotificationDropdown } from "@/components/NotificationDropdown";
import { useAuth } from "@/context/AuthContext";

function getInitials(name: string | undefined, role: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    return name.slice(0, 2).toUpperCase();
  }
  return role === "student" ? "ST" : role === "teacher" ? "TR" : "AK";
}

export function DashboardHeader({ title, description }: { title?: string; description?: string }) {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
  const role = user?.role ?? "admin";
  const displayName = user?.name ?? (role === "student" ? "Student" : role === "teacher" ? "Teacher" : "Admin");
  const initials = getInitials(user?.name, role);

  return (
    <header className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        {title ? (
          <>
            <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
            {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{today}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <NotificationDropdown />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 overflow-hidden rounded-full gradient-primary flex items-center justify-center">
            <span className="text-xs font-semibold text-primary-foreground">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-foreground">Welcome, {displayName}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
