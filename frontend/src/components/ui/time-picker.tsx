import * as React from "react";
import { Clock, ChevronUp, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface TimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  use24Hour?: boolean;
  interval?: number; // minutes interval (15, 30, etc)
  presets?: { label: string; time: string }[];
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
  disabled,
  clearable = true,
  use24Hour = false,
  interval = 15,
  presets,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse current value
  const parseTime = (timeStr: string): { hours: number; minutes: number } | null => {
    if (!timeStr) return null;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    return {
      hours: parseInt(match[1], 10),
      minutes: parseInt(match[2], 10),
    };
  };

  const currentTime = value ? parseTime(value) : null;

  // Generate time options
  const generateTimeOptions = () => {
    const options: { value: string; label: string; hours: number; minutes: number }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += interval) {
        const timeValue = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        let label: string;
        
        if (use24Hour) {
          label = timeValue;
        } else {
          const period = h >= 12 ? "PM" : "AM";
          const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
          label = `${displayH}:${String(m).padStart(2, "0")} ${period}`;
        }
        
        options.push({ value: timeValue, label, hours: h, minutes: m });
      }
    }
    return options;
  };

  const timeOptions = React.useMemo(() => generateTimeOptions(), [interval, use24Hour]);

  const handleSelect = (timeValue: string) => {
    onChange(timeValue);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const handleAdjustTime = (e: React.MouseEvent, direction: "up" | "down") => {
    e.stopPropagation();
    if (!currentTime) return;

    let newHours = currentTime.hours;
    let newMinutes = currentTime.minutes;

    if (direction === "up") {
      newMinutes += interval;
      if (newMinutes >= 60) {
        newMinutes = 0;
        newHours = (newHours + 1) % 24;
      }
    } else {
      newMinutes -= interval;
      if (newMinutes < 0) {
        newMinutes = 60 - interval;
        newHours = (newHours - 1 + 24) % 24;
      }
    }

    const newTime = `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
    onChange(newTime);
  };

  const displayValue = currentTime
    ? timeOptions.find((opt) => opt.value === value)?.label || value
    : placeholder;

  // Scroll to selected time when opened
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (open && scrollRef.current && currentTime) {
      const selectedIndex = timeOptions.findIndex(
        (opt) => opt.hours === currentTime.hours && opt.minutes === currentTime.minutes
      );
      if (selectedIndex !== -1) {
        const element = scrollRef.current.children[selectedIndex] as HTMLElement;
        if (element) {
          element.scrollIntoView({ block: "center", behavior: "instant" });
        }
      }
    }
  }, [open, currentTime, timeOptions]);

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
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayValue}</span>
          </div>
          <div className="flex items-center gap-1">
            {value && (
              <>
                <div
                  role="button"
                  onClick={(e) => handleAdjustTime(e, "down")}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </div>
                <div
                  role="button"
                  onClick={(e) => handleAdjustTime(e, "up")}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                </div>
              </>
            )}
            {clearable && value && (
              <div
                role="button"
                onClick={handleClear}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-muted ml-1"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-0 rounded-xl shadow-lg border border-border/60"
        align="start"
        sideOffset={4}
      >
        <div
          ref={scrollRef}
          className="max-h-64 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        >
          {timeOptions.map((option) => {
            const isSelected = value === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "w-full px-3 py-2 text-sm text-left transition-colors hover:bg-accent",
                  isSelected && "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {isSelected && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Quick time presets
export interface QuickTimePickerProps extends TimePickerProps {
  presets?: { label: string; time: string }[];
}

export function QuickTimePicker({
  presets = [
    { label: "Start of day", time: "08:00" },
    { label: "Noon", time: "12:00" },
    { label: "End of day", time: "17:00" },
  ],
  ...props
}: QuickTimePickerProps) {
  return (
    <div className="space-y-2">
      <TimePicker {...props} />
      <div className="flex flex-wrap gap-1">
        {presets.map((preset) => (
          <button
            key={preset.time}
            onClick={() => props.onChange(preset.time)}
            className="px-2 py-1 text-xs rounded-md bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}