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

  // Calculate visible story bars with active one fixed at position 0
  const maxVisibleBars = 5;
  const getVisibleStoryBars = () => {
    if (totalVideos <= maxVisibleBars) {
      return Array.from({ length: totalVideos }, (_, i) => i);
    }
    
    // Active bar is always at position 0, show bars after it
    const bars = [];
    for (let i = 0; i < maxVisibleBars && currentVideoIndex + i < totalVideos; i++) {
      bars.push(currentVideoIndex + i);
    }
    return bars;
  };

  const visibleBars = getVisibleStoryBars();
  const hasMoreBefore = currentVideoIndex > 0;
  const hasMoreAfter = currentVideoIndex + maxVisibleBars < totalVideos;

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
                {/* Indicator for more stories before */}
                {hasMoreBefore && (
                  <span className="text-white/30 text-[8px]">‹</span>
                )}
                
                {visibleBars.map((videoIndex, displayIndex) => {
                  const isCurrentVideo = videoIndex === currentVideoIndex;
                  
                  return (
                    <div
                      key={`video-${videoIndex}`}
                      className={cn(
                        "rounded-full transition-all duration-300 ease-out",
                        isCurrentVideo
                          ? "w-5 h-2 bg-white shadow-md"
                          : "w-2 h-1.5 bg-white/40"
                      )}
                      style={{
                        transform: `translateX(0)`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  );
                })}
                
                {/* Indicator for more stories after */}
                {hasMoreAfter && (
                  <span className="text-white/30 text-[8px]">›</span>
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
