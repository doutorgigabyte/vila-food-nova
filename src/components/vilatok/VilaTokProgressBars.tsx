interface VilaTokProgressBarsProps {
  totalVideos: number;
  currentVideoIndex: number;
  currentProgress: number;
}

export function VilaTokProgressBars({
  totalVideos,
  currentVideoIndex,
  currentProgress,
}: VilaTokProgressBarsProps) {
  return (
    <div className="absolute top-[72px] left-4 right-4 z-40 flex gap-1.5">
      {Array.from({ length: totalVideos }).map((_, index) => {
        let fillPercentage = 0;
        
        if (index < currentVideoIndex) {
          fillPercentage = 100;
        } else if (index === currentVideoIndex) {
          fillPercentage = currentProgress;
        } else {
          fillPercentage = 0;
        }

        return (
          <div 
            key={index}
            className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden"
          >
            <div 
              className="h-full bg-white rounded-full transition-all duration-75 ease-linear"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
