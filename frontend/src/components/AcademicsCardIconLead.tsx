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
      {/* <div
        className="flex w-14 shrink-0 items-center justify-center self-stretch rounded-lg bg-muted/80 text-[hsl(194,70%,27%)] shadow-sm sm:w-16"
        aria-hidden
      >
        <Icon className="h-6 w-6" strokeWidth={2} />
      </div> */}
      <div className="min-w-0 flex-1 space-y-1.5 text-left">
        <CardTitle className="text-base font-semibold leading-tight tracking-tight text-foreground sm:text-lg">
          {title}
        </CardTitle>
        <CardDescription className="text-sm leading-snug">{description}</CardDescription>
      </div>
    </div>
  );
}
