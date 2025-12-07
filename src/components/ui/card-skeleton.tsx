import { cn } from "@/lib/utils";

interface CardSkeletonProps {
  variant?: "product" | "establishment" | "banner";
  className?: string;
}

export const CardSkeleton = ({ variant = "product", className }: CardSkeletonProps) => {
  if (variant === "product") {
    return (
      <div className={cn("rounded-2xl overflow-hidden bg-card", className)}>
        <div className="aspect-square skeleton-shimmer" />
        <div className="p-3 space-y-2">
          <div className="h-3 skeleton-shimmer rounded w-1/3" />
          <div className="h-4 skeleton-shimmer rounded w-3/4" />
          <div className="h-4 skeleton-shimmer rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (variant === "establishment") {
    return (
      <div className={cn("rounded-2xl overflow-hidden bg-card", className)}>
        <div className="aspect-[16/9] skeleton-shimmer" />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full skeleton-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 skeleton-shimmer rounded w-2/3" />
              <div className="h-3 skeleton-shimmer rounded w-1/2" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-6 skeleton-shimmer rounded-full w-16" />
            <div className="h-6 skeleton-shimmer rounded-full w-20" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className={cn("aspect-[2.5/1] rounded-2xl skeleton-shimmer", className)} />
    );
  }

  return null;
};

export const ProductGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="product-grid">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} variant="product" />
    ))}
  </div>
);

export const EstablishmentGridSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="establishment-grid">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} variant="establishment" />
    ))}
  </div>
);

export default CardSkeleton;
