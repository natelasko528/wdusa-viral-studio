import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    return (
      <div className="space-y-1">
        {label ? (
          <label htmlFor={inputId} className="block text-xs font-medium text-[var(--text-muted)]">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] ${error ? "border-[var(--danger-border)]" : ""} ${className}`}
          {...props}
        />
        {hint && !error ? <p className="text-[11px] text-[var(--text-muted)]">{hint}</p> : null}
        {error ? <p className="text-[11px] text-[var(--danger-text)]">{error}</p> : null}
      </div>
    );
  },
);

Input.displayName = "Input";
