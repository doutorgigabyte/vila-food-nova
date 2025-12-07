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
  const maxDots = 7;
  const half = Math.floor(maxDots / 2);
  
  // Get visible dots with active centered
  const getVisibleDots = () => {
    if (totalEstablishments <= maxDots) {
      return Array.from({ length: totalEstablishments }, (_, i) => i);
    }
    
    const dots: number[] = [];
    for (let i = 0; i < maxDots; i++) {
      const idx = currentEstablishmentIndex - half + i;
      dots.push(idx >= 0 && idx < totalEstablishments ? idx : -1);
    }
    return dots;
  };

  const visibleDots = getVisibleDots();
  const hasMoreBefore = currentEstablishmentIndex > half;
  const hasMoreAfter = currentEstablishmentIndex < totalEstablishments - half - 1;

  // Get visible story bars
  const maxBars = 5;
  const getVisibleBars = () => {
    if (totalVideos <= maxBars) return Array.from({ length: totalVideos }, (_, i) => i);
    const bars = [];
    for (let i = 0; i < maxBars && currentVideoIndex + i < totalVideos; i++) {
      bars.push(currentVideoIndex + i);
    }
    return bars;
  };

  const visibleBars = getVisibleBars();
  const hasMoreStoriesBefore = currentVideoIndex > 0;
  const hasMoreStoriesAfter = currentVideoIndex + maxBars < totalVideos;

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
      {hasMoreBefore && <span className="text-white/40 text-[10px] text-center">•••</span>}
      
      {visibleDots.map((estIndex, pos) => {
        if (estIndex < 0) return null;
        const isActive = estIndex === currentEstablishmentIndex;
        
        return (
          <div key={pos} className="flex items-center gap-1.5 transition-all duration-300">
            <div className={cn(
              "rounded-full transition-all duration-300",
              isActive ? "w-3 h-3 bg-primary shadow-lg shadow-primary/50" : "w-2 h-2 bg-white/40"
            )} />
            
            {isActive && totalVideos > 1 && (
              <div className="flex items-center gap-1">
                {hasMoreStoriesBefore && <span className="text-white/30 text-[8px]">‹</span>}
                {visibleBars.map((vidIdx) => (
                  <div
                    key={vidIdx}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      vidIdx === currentVideoIndex ? "w-5 h-2 bg-white" : "w-2 h-1.5 bg-white/40"
                    )}
                  />
                ))}
                {hasMoreStoriesAfter && <span className="text-white/30 text-[8px]">›</span>}
              </div>
            )}
          </div>
        );
      })}
      
      {hasMoreAfter && <span className="text-white/40 text-[10px] text-center">•••</span>}
    </div>
  );
}