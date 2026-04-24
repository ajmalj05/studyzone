import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface PillTab {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface PillTabsProps {
  tabs: PillTab[];
  activeValue: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function PillTabs({ tabs, activeValue, onValueChange, className }: PillTabsProps) {
  return (
    <div className={cn("bg-slate-50 border border-slate-200 rounded-lg p-1", className)}>
      <nav className="flex items-center gap-1 w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => onValueChange(tab.value)}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors rounded-md flex items-center justify-center gap-2 flex-1",
                activeValue === tab.value
                  ? "bg-[hsl(194,70%,27%)] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
