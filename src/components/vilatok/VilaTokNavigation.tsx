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
  const maxVisibleDots = 7;
  const halfVisible = Math.floor(maxVisibleDots / 2);
  
  // Calculate visible range for establishments
  let startIndex = 0;
  let endIndex = Math.min(totalEstablishments, maxVisibleDots);
  
  if (totalEstablishments > maxVisibleDots) {
    if (currentEstablishmentIndex <= halfVisible) {
      startIndex = 0;
      endIndex = maxVisibleDots;
    } else if (currentEstablishmentIndex >= totalEstablishments - halfVisible - 1) {
      startIndex = totalEstablishments - maxVisibleDots;
      endIndex = totalEstablishments;
    } else {
      startIndex = currentEstablishmentIndex - halfVisible;
      endIndex = currentEstablishmentIndex + halfVisible + 1;
    }
  }

  const visibleEstablishments = Array.from(
    { length: endIndex - startIndex },
    (_, i) => startIndex + i
  );

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
      {/* Show ellipsis if there are hidden dots above */}
      {startIndex > 0 && (
        <span className="text-white/40 text-[10px] font-medium text-center">
          •••
        </span>
      )}
      
      {visibleEstablishments.map((estIndex) => {
        const isActive = estIndex === currentEstablishmentIndex;
        
        return (
          <div key={`est-${estIndex}`} className="flex items-center gap-1.5">
            {/* Establishment dot */}
            <div
              className={cn(
                "rounded-full transition-all duration-300 flex-shrink-0",
                isActive
                  ? "w-3 h-3 bg-primary shadow-lg shadow-primary/50"
                  : "w-2 h-2 bg-white/40"
              )}
            />
            
            {/* Story bars - only show for active establishment */}
            {isActive && totalVideos > 1 && (
              <div className="flex items-center gap-1 overflow-hidden">
                {Array.from({ length: Math.min(totalVideos, 6) }).map((_, videoIndex) => (
                  <div
                    key={`video-${videoIndex}`}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      videoIndex === currentVideoIndex
                        ? "w-4 h-1.5 bg-white shadow-md"
                        : "w-2 h-1.5 bg-white/40"
                    )}
                  />
                ))}
                {totalVideos > 6 && (
                  <span className="text-white/40 text-[8px] font-medium ml-0.5">
                    +{totalVideos - 6}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Show ellipsis if there are hidden dots below */}
      {endIndex < totalEstablishments && (
        <span className="text-white/40 text-[10px] font-medium text-center">
          •••
        </span>
      )}
    </div>
  );
}
