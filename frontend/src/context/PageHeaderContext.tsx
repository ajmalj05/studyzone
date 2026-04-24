import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type DependencyList,
  type ReactNode,
} from "react";

export type PageHeaderConfig = {
  title?: string;
  description?: string;
  /** When false, hides the academic year badge in the header row. Default true. */
  showYearBadge?: boolean;
  /** Replaces the year badge slot (e.g. custom actions). */
  toolbarEnd?: ReactNode;
};

type PageHeaderContextValue = {
  config: PageHeaderConfig;
  setConfig: (next: PageHeaderConfig) => void;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<PageHeaderConfig>({});
  const setConfig = useCallback((next: PageHeaderConfig) => {
    setConfigState(next);
  }, []);
  const value = useMemo(() => ({ config, setConfig }), [config, setConfig]);
  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function usePageHeaderConfig(): PageHeaderConfig {
  const ctx = useContext(PageHeaderContext);
  return ctx?.config ?? {};
}

export function usePageHeaderDispatch(): (next: PageHeaderConfig) => void {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error("usePageHeaderDispatch must be used within PageHeaderProvider");
  }
  return ctx.setConfig;
}

/** Same as {@link usePageHeaderDispatch} but returns null when not under admin layout (e.g. teacher portal reuses a page). */
export function useOptionalPageHeaderDispatch(): ((next: PageHeaderConfig) => void) | null {
  return useContext(PageHeaderContext)?.setConfig ?? null;
}

/** Registers page title/description for the admin layout header; clears on unmount. */
export function usePageHeaderConfigEffect(config: PageHeaderConfig, deps: DependencyList) {
  const setConfig = usePageHeaderDispatch();
  useEffect(() => {
    setConfig(config);
    return () => setConfig({});
  }, deps);
}
