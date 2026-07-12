import { classNames } from '../../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={classNames('shimmer rounded-lg', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}
