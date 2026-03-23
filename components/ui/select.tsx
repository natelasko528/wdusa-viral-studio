import { forwardRef, type SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, className = "", id, children, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    return (
      <div className="space-y-1">
        {label ? (
          <label htmlFor={inputId} className="block text-xs font-medium text-[var(--text-muted)]">
            {label}
          </label>
        ) : null}
        <select
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] ${className}`}
          {...props}
        >
          {children}
        </select>
        {hint ? <p className="text-[11px] text-[var(--text-muted)]">{hint}</p> : null}
      </div>
    );
  },
);

Select.displayName = "Select";
