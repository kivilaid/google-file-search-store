interface LoadingSkeletonProps {
  variant?: 'card' | 'row' | 'text';
  count?: number;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-3">
      <div className="w-9 h-9 rounded-lg bg-[var(--bg-elevated)] animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-[var(--bg-elevated)] animate-pulse" />
      <div className="h-3 w-1/2 rounded bg-[var(--bg-elevated)] animate-pulse" />
      <div className="h-3 w-1/3 rounded bg-[var(--bg-elevated)] animate-pulse" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-[var(--border-subtle)]">
      <div className="w-4 h-4 rounded bg-[var(--bg-elevated)] animate-pulse" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-1/3 rounded bg-[var(--bg-elevated)] animate-pulse" />
        <div className="h-2.5 w-1/4 rounded bg-[var(--bg-elevated)] animate-pulse" />
      </div>
      <div className="h-5 w-16 rounded-full bg-[var(--bg-elevated)] animate-pulse" />
    </div>
  );
}

function SkeletonText() {
  return (
    <div className="space-y-2">
      <div className="h-3.5 w-full rounded bg-[var(--bg-elevated)] animate-pulse" />
      <div className="h-3.5 w-5/6 rounded bg-[var(--bg-elevated)] animate-pulse" />
      <div className="h-3.5 w-2/3 rounded bg-[var(--bg-elevated)] animate-pulse" />
    </div>
  );
}

export default function LoadingSkeleton({ variant = 'card', count = 3 }: LoadingSkeletonProps) {
  const Component = variant === 'card' ? SkeletonCard : variant === 'row' ? SkeletonRow : SkeletonText;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </>
  );
}
