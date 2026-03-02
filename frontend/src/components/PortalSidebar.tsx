import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, ChevronLeft, ChevronRight, LucideIcon } from "lucide-react";
import { LogoutModal } from "@/components/LogoutModal";
import logoImg from "@/assets/logo.png";

export interface MenuItem {
  title: string;
  icon: LucideIcon;
  path: string;
  subItems?: { title: string; path: string }[];
}

export interface PortalSidebarContentProps {
  menuItems: MenuItem[];
  portalName: string;
  logoutPath?: string;
  onNavigate?: () => void;
  isInDrawer?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  expandedMenuKey?: string | null;
  onExpandedMenuKeyChange?: (key: string | null) => void;
}

export interface PortalSidebarProps {
  menuItems: MenuItem[];
  portalName: string;
  logoutPath?: string;
}

export function PortalSidebarContent({
  menuItems,
  portalName,
  logoutPath = "/login",
  onNavigate,
  isInDrawer = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  expandedMenuKey: controlledExpanded,
  onExpandedMenuKeyChange,
}: PortalSidebarContentProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState<string | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const collapsed = isInDrawer ? false : (controlledCollapsed ?? internalCollapsed);
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;
  const expandedMenuKey = controlledExpanded ?? internalExpanded;
  const setExpandedMenuKey = onExpandedMenuKeyChange ?? setInternalExpanded;

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <>
      <div className="flex h-full flex-col gradient-sidebar">
        <div className="flex items-center gap-3 px-5 py-6">
          <img src={logoImg} alt="Studyzone" className="h-10 w-10 flex-shrink-0 object-contain" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap">
                <span className="text-lg font-bold text-sidebar-foreground">{portalName}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="sidebar-nav-scroll flex-1 space-y-1 px-3 overflow-y-auto">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path || (item.subItems && item.subItems.some(sub => location.pathname === sub.path));
            const isExpanded = expandedMenuKey === item.title;

            return (
              <div key={item.title}>
                <motion.button
                  initial={isInDrawer ? false : { x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: isInDrawer ? 0 : index * 0.05, duration: 0.3 }}
                  onClick={() => {
                    if (item.subItems) {
                      if (collapsed) setCollapsed(false);
                      setExpandedMenuKey(isExpanded ? null : item.title);
                    } else {
                      handleNav(item.path);
                    }
                  }}
                  className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 min-h-[44px] ${isActive ? "bg-sidebar-primary/20 text-sidebar-foreground shadow-glow backdrop-blur-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-primary/10 hover:text-sidebar-foreground"}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="whitespace-nowrap overflow-hidden">{item.title}</motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {!collapsed && item.subItems && (
                    <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                  )}
                </motion.button>

                <AnimatePresence>
                  {!collapsed && isExpanded && item.subItems && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-1 flex flex-col gap-1 pl-11 pr-2">
                        {item.subItems.map(subItem => (
                          <button
                            key={subItem.path}
                            onClick={() => handleNav(subItem.path)}
                            className={`flex w-full items-center rounded-lg px-3 py-2 text-sm min-h-[44px] transition-all duration-200 ${location.pathname === subItem.path ? "bg-sidebar-primary/20 text-sidebar-foreground font-semibold" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-primary/10"}`}
                          >
                            {subItem.title}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <button onClick={() => setShowLogout(true)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium min-h-[44px] text-sidebar-foreground/70 transition-all hover:bg-sidebar-primary/10 hover:text-sidebar-foreground">
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (<motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">Logout</motion.span>)}
            </AnimatePresence>
          </button>
        </div>

        {!isInDrawer && (
          <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full bg-card text-foreground shadow-card transition-all hover:shadow-card-hover">
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        )}
      </div>

      <LogoutModal open={showLogout} onClose={() => setShowLogout(false)} onConfirm={() => { navigate(logoutPath); onNavigate?.(); }} />
    </>
  );
}

export function PortalSidebar({ menuItems, portalName, logoutPath = "/login" }: PortalSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenuKey, setExpandedMenuKey] = useState<string | null>(null);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`gradient-sidebar fixed left-0 top-0 z-50 flex h-screen flex-col transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}
    >
      <PortalSidebarContent
        menuItems={menuItems}
        portalName={portalName}
        logoutPath={logoutPath}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        expandedMenuKey={expandedMenuKey}
        onExpandedMenuKeyChange={setExpandedMenuKey}
      />
    </motion.aside>
  );
}
