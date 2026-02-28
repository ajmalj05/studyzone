import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  color: string;
  delay?: number;
}

export function StatCard({ title, value, prefix = "", suffix = "", icon: Icon, color }: StatCardProps) {
  return (
    <div className="card-hover rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {prefix}{value.toLocaleString()}{suffix}
          </p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${color}`}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
}
