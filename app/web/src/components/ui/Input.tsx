import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-body font-bold text-sm text-ink"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "bg-surface border-[2.5px] border-ink rounded-lg px-4 py-3",
            "font-body font-semibold text-ink placeholder:text-muted",
            "outline-none transition-shadow",
            "focus:ring-2 focus:ring-primary",
            error && "ring-2 ring-primary",
            className,
          )}
          {...props}
        />
        {error && (
          <span className="font-body font-semibold text-sm text-primary">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
