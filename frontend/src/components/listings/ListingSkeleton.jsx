export default function ListingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-square w-full rounded-2xl shimmer" />
      <div className="h-4 w-2/3 rounded shimmer" />
      <div className="h-3 w-1/2 rounded shimmer" />
      <div className="h-3 w-1/3 rounded shimmer" />
    </div>
  );
}
