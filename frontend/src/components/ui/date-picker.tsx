import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  format?: string;
  clearable?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  
  // Convert string value (YYYY-MM-DD) to Date object for Calendar
  const selectedDate = value ? new Date(value + "T12:00:00") : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Convert Date to YYYY-MM-DD format
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange("");
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const displayValue = value
    ? format(new Date(value + "T12:00:00"), "MMM dd, yyyy")
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between rounded-lg border-border/70 bg-background px-3 font-normal text-sm shadow-sm hover:bg-accent hover:text-accent-foreground",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayValue}</span>
          </div>
          <div className="flex items-center gap-1">
            {clearable && value && (
              <div
                role="button"
                onClick={handleClear}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-xl shadow-lg border border-border/60"
        align="start"
        sideOffset={4}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          className="rounded-xl"
        />
      </PopoverContent>
    </Popover>
  );
}

// Date range picker for filtering
export interface DateRangePickerProps {
  from?: string;
  to?: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  className?: string;
}

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  fromPlaceholder = "From",
  toPlaceholder = "To",
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DatePicker
        value={from}
        onChange={onFromChange}
        placeholder={fromPlaceholder}
        className="flex-1"
      />
      <span className="text-muted-foreground text-sm">to</span>
      <DatePicker
        value={to}
        onChange={onToChange}
        placeholder={toPlaceholder}
        className="flex-1"
      />
    </div>
  );
}