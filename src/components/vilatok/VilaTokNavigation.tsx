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
      {/* Vertical dots (establishments) - LEFT side */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        {Array.from({ length: Math.min(totalEstablishments, 8) }).map((_, i) => (
          <div
            key={`v-${i}`}
            className={cn(
              "rounded-full transition-all duration-300",
              i === currentEstablishmentIndex
                ? "w-2.5 h-6 bg-primary shadow-lg shadow-primary/50"
                : "w-2 h-2 bg-white/40 hover:bg-white/60"
            )}
          />
        ))}
        {totalEstablishments > 8 && (
          <span className="text-white/50 text-[10px] font-medium mt-1">
            +{totalEstablishments - 8}
          </span>
        )}
      </div>

      {/* Horizontal dots (videos/stories) - RIGHT side */}
      {totalVideos > 1 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
          {Array.from({ length: Math.min(totalVideos, 8) }).map((_, i) => (
            <div
              key={`h-${i}`}
              className={cn(
                "rounded-full transition-all duration-300",
                i === currentVideoIndex
                  ? "w-2.5 h-6 bg-white shadow-lg"
                  : "w-2 h-2 bg-white/30 hover:bg-white/50"
              )}
            />
          ))}
          {totalVideos > 8 && (
            <span className="text-white/40 text-[10px] font-medium mt-1">
              +{totalVideos - 8}
            </span>
          )}
        </div>
      )}
    </>
  );
}
