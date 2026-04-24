import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onChange, inputMode, pattern, step, ...props }, ref) => {
    const isNumericTextInput = type === "number";
    const allowsDecimal = isNumericTextInput && step !== undefined && step !== 1 && step !== "1";

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isNumericTextInput) {
        const value = event.currentTarget.value;
        const sanitized = allowsDecimal
          ? value
              .replace(/[^\d.]/g, "")
              .replace(/(\..*)\./g, "$1")
          : value.replace(/\D/g, "");

        if (value !== sanitized) {
          event.currentTarget.value = sanitized;
        }
      }

      onChange?.(event);
    };

    return (
      <input
        type={isNumericTextInput ? "text" : type}
        inputMode={isNumericTextInput ? inputMode ?? (allowsDecimal ? "decimal" : "numeric") : inputMode}
        pattern={isNumericTextInput ? pattern ?? (allowsDecimal ? "[0-9]*[.]?[0-9]*" : "[0-9]*") : pattern}
        onChange={handleChange}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        step={step}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
