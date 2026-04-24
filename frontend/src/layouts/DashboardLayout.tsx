import { ReactNode, useState } from "react";
import { AppSidebar, AppSidebarContent } from "@/components/AppSidebar";
import { MobileBottomNav, getAdminBottomNavItems } from "@/components/MobileBottomNav";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileMenuProvider } from "@/context/MobileMenuContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  return (
    <MobileMenuProvider open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <div className="flex h-dvh min-h-0 overflow-hidden bg-background">
        {!isMobile && <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />}
        {isMobile && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent
              side="left"
              className="w-[280px] max-w-[280px] p-0 gap-0 border-r bg-transparent"
              aria-describedby="dashboard-menu-desc"
            >
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <SheetDescription id="dashboard-menu-desc" className="sr-only">
                Open dashboard navigation links
              </SheetDescription>
              <div className="h-full w-full">
                <AppSidebarContent
                  isInDrawer
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
        <main
          className={`flex min-h-0 flex-1 w-full min-w-0 flex-col overflow-x-hidden overflow-y-hidden bg-muted/25 p-3 lg:p-4 transition-[margin] duration-300 ml-0 ${isMobile ? "pb-20" : sidebarCollapsed ? "md:ml-20" : "md:ml-64"}`}
        >
          {children}
        </main>
        {isMobile && <MobileBottomNav items={getAdminBottomNavItems()} />}
      </div>
    </MobileMenuProvider>
  );
}
