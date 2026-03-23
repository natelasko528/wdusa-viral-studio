import type { ReactNode } from "react";

type Variant = "default" | "success" | "warning" | "danger" | "accent";

const variantStyles: Record<Variant, string> = {
  default: "bg-[var(--code-bg)] text-[var(--text-secondary)]",
  success: "bg-emerald-500/10 text-[var(--success)]",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-[var(--danger-bg)] text-[var(--danger-text)]",
  accent: "bg-[var(--accent-muted)] text-[var(--accent)]",
};

type BadgeProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variant: Variant =
    status === "succeeded" ? "success"
    : status === "failed" ? "danger"
    : status === "rendering" || status === "running" || status === "queued" ? "warning"
    : status === "scheduled" ? "accent"
    : "default";
  return <Badge variant={variant}>{status}</Badge>;
}
