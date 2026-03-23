type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--border)] ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <Skeleton className="ml-4 h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-16 rounded-md" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-3/4" />
    </div>
  );
}
