import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <span className="relative inline-flex items-center">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            "peer appearance-none size-5 rounded border border-slate-300 bg-white",
            "checked:bg-brand-600 checked:border-brand-600",
            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        <Check className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 peer-checked:opacity-100" />
      </span>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
