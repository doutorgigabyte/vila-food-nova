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
  
  // Calculate which dots to show - active dot stays in fixed center position
  const getVisibleEstablishments = () => {
    if (totalEstablishments <= maxVisibleDots) {
      // If we have fewer than max, show all and calculate center position for active
      return {
        dots: Array.from({ length: totalEstablishments }, (_, i) => i),
        activePosition: currentEstablishmentIndex
      };
    }
    
    // Active dot is ALWAYS at center position (halfVisible)
    // Calculate which dots to show around it
    const dots: number[] = [];
    
    for (let pos = 0; pos < maxVisibleDots; pos++) {
      // Calculate which establishment index should be at this position
      const offset = pos - halfVisible;
      const estIndex = currentEstablishmentIndex + offset;
      
      if (estIndex >= 0 && estIndex < totalEstablishments) {
        dots.push(estIndex);
      } else if (estIndex < 0) {
        // Before first - push placeholder (-1)
        dots.push(-1);
      } else {
        // After last - push placeholder (-2)
        dots.push(-2);
      }
    }
    
    return {
      dots,
      activePosition: halfVisible // Always centered
    };
  };

  const { dots: visibleDots, activePosition } = getVisibleEstablishments();
  const hasMoreBefore = currentEstablishmentIndex > 0;
  const hasMoreAfter = currentEstablishmentIndex < totalEstablishments - 1;

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
  const hasMoreStoriesBefore = currentVideoIndex > 0;
  const hasMoreStoriesAfter = currentVideoIndex + maxVisibleBars < totalVideos;

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
      {/* Show ellipsis if there are hidden dots above */}
      {hasMoreBefore && visibleDots[0] !== 0 && (
        <span className="text-white/40 text-[10px] font-medium text-center">
          •••
        </span>
      )}
      
      {visibleDots.map((estIndex, position) => {
        // Skip placeholders
        if (estIndex < 0) return null;
        
        const isActive = estIndex === currentEstablishmentIndex;
        
        return (
          <div 
            key={`est-${estIndex}`} 
            className="flex items-center gap-1.5"
            style={{
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
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
                {hasMoreStoriesBefore && (
                  <span className="text-white/30 text-[8px]">‹</span>
                )}
                
                {visibleBars.map((videoIndex) => {
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
                    />
                  );
                })}
                
                {/* Indicator for more stories after */}
                {hasMoreStoriesAfter && (
                  <span className="text-white/30 text-[8px]">›</span>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Show ellipsis if there are hidden dots below */}
      {hasMoreAfter && visibleDots[visibleDots.length - 1] !== totalEstablishments - 1 && (
        <span className="text-white/40 text-[10px] font-medium text-center">
          •••
        </span>
      )}
    </div>
  );
}
