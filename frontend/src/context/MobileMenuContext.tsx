import { createContext, useContext, useCallback, ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

type MobileMenuContextValue = {
  openMobileMenu: () => void;
  isMobile: boolean;
};

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

export function useMobileMenu() {
  const ctx = useContext(MobileMenuContext);
  return ctx;
}

type MobileMenuProviderProps = {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileMenuProvider({ children, open, onOpenChange }: MobileMenuProviderProps) {
  const isMobile = useIsMobile();
  const openMobileMenu = useCallback(() => {
    onOpenChange(true);
  }, [onOpenChange]);

  const value: MobileMenuContextValue = {
    openMobileMenu,
    isMobile,
  };

  return (
    <MobileMenuContext.Provider value={value}>
      {children}
    </MobileMenuContext.Provider>
  );
}
