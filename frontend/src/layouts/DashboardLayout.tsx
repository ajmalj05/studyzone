import { ReactNode, useState } from "react";
import { AppSidebar, AppSidebarContent } from "@/components/AppSidebar";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileMenuProvider } from "@/context/MobileMenuContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <MobileMenuProvider open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <div className="flex min-h-screen bg-background">
        {!isMobile && <AppSidebar />}
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
        <main className="flex-1 w-full min-w-0 p-3 lg:p-4 ml-0 md:ml-64">
          {children}
        </main>
      </div>
    </MobileMenuProvider>
  );
}
