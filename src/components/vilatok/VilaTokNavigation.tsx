import { cn } from '@/lib/utils';

interface VilaTokNavigationProps {
  totalEstablishments: number;
  currentEstablishmentIndex: number;
  totalVideos: number;
  currentVideoIndex: number;
}

export function VilaTokNavigation({
  totalEstablishments,
  currentEstablishmentIndex,
  totalVideos,
  currentVideoIndex,
}: VilaTokNavigationProps) {
  return (
    <>
      {/* Vertical dots (establishments) - right side */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
        {Array.from({ length: Math.min(totalEstablishments, 10) }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              i === currentEstablishmentIndex
                ? "bg-white w-1.5 h-4"
                : "bg-white/40"
            )}
          />
        ))}
        {totalEstablishments > 10 && (
          <span className="text-white/60 text-[8px] mt-1">
            +{totalEstablishments - 10}
          </span>
        )}
      </div>

      {/* Swipe hints */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20 opacity-50">
        <div className="flex items-center gap-4 text-white/70 text-xs">
          <span>← →</span>
          <span className="text-white/50">|</span>
          <span>↑ ↓</span>
        </div>
      </div>
    </>
  );
}
