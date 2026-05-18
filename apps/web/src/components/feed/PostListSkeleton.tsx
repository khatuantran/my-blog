// Skeleton card placeholder cho Feed loading state.
// T-061 sẽ thay thế bằng PostCard thật.

export function PostListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-lg border border-b2 bg-surf"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
