import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, MessageSquare, DollarSign, FileText, X } from "lucide-react";
import { fetchApi } from "@/lib/api";

type NotificationType = "PortalRequest" | "FeePayment";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  createdAt: string;
}

const ICON_MAP = {
  PortalRequest: MessageSquare,
  FeePayment: DollarSign,
} as const;

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const list = (await fetchApi("/Notifications?take=50")) as NotificationItem[];
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setItems([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const dismiss = async (id: string) => {
    try {
      await fetchApi(`/Notifications/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // keep item on error
    }
  };

  const displayItems = items.map((n) => ({
    ...n,
    icon: (ICON_MAP[n.type] ?? FileText) as typeof MessageSquare,
    text: n.title,
    time: formatRelativeTime(n.createdAt),
  }));

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card transition-all hover:shadow-card-hover">
        <Bell className="h-5 w-5 text-muted-foreground" />
        {displayItems.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-card">
            {displayItems.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-12 z-50 w-80 rounded-2xl bg-card shadow-card-hover border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
                <span className="text-xs text-muted-foreground">{displayItems.length} new</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">Loading...</p>
                ) : error ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">Could not load notifications</p>
                ) : displayItems.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">No new notifications</p>
                ) : (
                  displayItems.map((n, i) => (
                    <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg gradient-primary">
                        <n.icon className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-relaxed">{n.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                      </div>
                      <button onClick={() => dismiss(n.id)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
