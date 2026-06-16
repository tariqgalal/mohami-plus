import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white shadow-md shadow-brand-600/20 hover:shadow-lg hover:shadow-brand-600/30",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow",
        outline:
          "border border-slate-300 bg-white hover:bg-slate-50 hover:border-brand-400 text-slate-900",
        secondary:
          "bg-slate-200 text-slate-900 hover:bg-slate-300",
        ghost: "hover:bg-slate-100 text-slate-700",
        link: "text-brand-600 underline-offset-4 hover:underline",
        admin:
          "bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-md shadow-amber-600/20 hover:shadow-lg hover:shadow-amber-600/30",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
