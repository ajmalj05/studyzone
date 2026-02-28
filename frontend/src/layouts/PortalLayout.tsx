import { ReactNode } from "react";
import { PortalSidebar } from "@/components/PortalSidebar";
import { LucideIcon } from "lucide-react";

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
}

export function PortalLayout({ children, menuItems, portalName }: PortalLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <PortalSidebar menuItems={menuItems} portalName={portalName} />
      <main className="ml-64 flex-1 p-3 lg:p-4">
        {children}
      </main>
    </div>
  );
}
