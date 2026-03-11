import { ReactNode, useState } from "react";
import { PortalSidebar, PortalSidebarContent } from "@/components/PortalSidebar";
import { MobileBottomNav, getPortalBottomNavItems } from "@/components/MobileBottomNav";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { LucideIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileMenuProvider } from "@/context/MobileMenuContext";

interface MenuItem {
  title: string;
  icon: LucideIcon;
  path: string;
  subItems?: { title: string; path: string }[];
}

interface PortalLayoutProps {
  children: ReactNode;
  menuItems: MenuItem[];
  portalName: string;
  logoutPath?: string;
}

export function PortalLayout({ children, menuItems, portalName, logoutPath }: PortalLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <MobileMenuProvider open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <div className="flex min-h-screen bg-background">
        {!isMobile && (
          <PortalSidebar menuItems={menuItems} portalName={portalName} logoutPath={logoutPath} />
        )}
        {isMobile && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent
              side="left"
              className="w-[280px] max-w-[280px] p-0 gap-0 border-r bg-transparent"
              aria-describedby="portal-menu-desc"
            >
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <SheetDescription id="portal-menu-desc" className="sr-only">
                Open portal navigation links
              </SheetDescription>
              <div className="h-full w-full">
                <PortalSidebarContent
                  menuItems={menuItems}
                  portalName={portalName}
                  logoutPath={logoutPath}
                  isInDrawer
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
        <main className={`flex-1 w-full min-w-0 p-3 lg:p-4 ml-0 md:ml-64 ${isMobile ? "pb-20" : ""}`}>
          {children}
        </main>
        {isMobile && <MobileBottomNav items={getPortalBottomNavItems(menuItems)} />}
      </div>
    </MobileMenuProvider>
  );
}
