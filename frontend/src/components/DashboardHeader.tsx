import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { useAuth } from "@/context/AuthContext";
import { useMobileMenu } from "@/context/MobileMenuContext";

function getInitials(name: string | undefined, role: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    return name.slice(0, 2).toUpperCase();
  }
  return role === "teacher" ? "TR" : role === "parent" ? "PA" : "AK";
}

export function DashboardHeader({
  title,
  description,
  /** When false, parent supplies sticky positioning (e.g. admin header bar). Default true. */
  sticky = true,
  /** When false, notifications/avatar/welcome are omitted (e.g. admin bar renders them by the year badge). Default true. */
  showActions = true,
  /** When true with showActions, shows “Welcome, …” next to the avatar. Default true. */
  showWelcomeMessage = true,
}: {
  title?: string;
  description?: string;
  sticky?: boolean;
  showActions?: boolean;
  showWelcomeMessage?: boolean;
}) {
  const { user } = useAuth();
  const mobileMenu = useMobileMenu();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
  const role = user?.role ?? "admin";
  const displayName = user?.name ?? (role === "teacher" ? "Teacher" : role === "parent" ? "Parent" : "Admin");
  const initials = getInitials(user?.name, role);

  return (
    <header
      className={`${sticky ? "sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 " : ""}flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 pb-0 sm:pb-0`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {mobileMenu?.isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 min-h-[44px] min-w-[44px] md:hidden"
            onClick={mobileMenu.openMobileMenu}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
        {title ? (
          <>
            <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
            {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{today}</p>
        )}
        </div>
      </div>
      {showActions ? (
        <div className="flex shrink-0 items-center gap-3">
          <NotificationDropdown />
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full gradient-primary">
              <span className="text-xs font-semibold text-primary-foreground">{initials}</span>
            </div>
            {showWelcomeMessage ? (
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-foreground">Welcome, {displayName}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
