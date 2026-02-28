import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface AuditLogEntryDto {
  id: string;
  tableName: string;
  action: string;
  entityId?: string;
  timestamp: string;
  userName?: string;
  details?: string;
}

function formatTimeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "Just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hour(s) ago`;
  return `${Math.floor(sec / 86400)} day(s) ago`;
}

function activityText(entry: AuditLogEntryDto): string {
  const who = entry.userName ? ` by ${entry.userName}` : "";
  return `${entry.action} on ${entry.tableName}${who}`;
}

export function RecentActivity() {
  const [items, setItems] = useState<AuditLogEntryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/AuditLog?take=10")
      .then((res: { items?: AuditLogEntryDto[] }) => setItems(res?.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
      <p className="text-xs text-muted-foreground">Latest audit log</p>

      {loading ? (
        <div className="mt-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2">
              <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                <div className="h-3 w-16 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">No recent activity.</p>
          ) : (
            items.slice(0, 8).map((entry) => (
              <div key={entry.id} className="flex items-start gap-2">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{activityText(entry)}</p>
                  <p className="text-xs text-muted-foreground">{formatTimeAgo(new Date(entry.timestamp))}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
