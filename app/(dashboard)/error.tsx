"use client";

import { Button } from "@/components/ui";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger-bg)] text-[var(--danger-text)]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <Button variant="secondary" className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
