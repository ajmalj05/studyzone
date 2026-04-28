import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AcademicsCardIconLeadProps = {
  icon: LucideIcon;
  title: ReactNode;
  description: ReactNode;
  className?: string;
};

/** Icon in a soft rounded square that stretches to the height of the title + description (Academics hub cards). */
export function AcademicsCardIconLead({
  icon: Icon,
  title,
  description,
  className,
}: AcademicsCardIconLeadProps) {
  return (
    <div className={cn("flex min-w-0 flex-1 items-stretch gap-3 sm:gap-4", className)}>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-[10px] border border-teal-200 bg-teal-50 text-teal-700"
        aria-hidden
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5 text-left">
        <CardTitle className="text-[15px] font-bold leading-tight tracking-tight text-slate-900 sm:text-base">
          {title}
        </CardTitle>
        <CardDescription className="text-xs leading-snug text-slate-500">{description}</CardDescription>
      </div>
    </div>
  );
}
