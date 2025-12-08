import { useState, useRef, useEffect, useCallback } from "react";
import { Play, X, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  description?: string;
  duration: number;
}

interface StoreStoriesProps {
  stories: Story[];
  establishmentName: string;
  establishmentLogo?: string;
  primaryColor?: string;
  isOpen: boolean;
  onClose: () => void;
}

const StoreStories = ({ 
  stories, 
  establishmentName, 
  establishmentLogo,
  primaryColor,
  isOpen,
  onClose,
}: StoreStoriesProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout>();

  const currentStory = stories[currentIndex];
  const hasStories = stories.length > 0;

  // Progress timer
  useEffect(() => {
    if (!isOpen || isPaused) return;

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        // Calculate increment based on story duration (default 15s)
        const duration = currentStory?.duration || 15;
        return prev + (100 / (duration * 10)); // Update every 100ms
      });
    }, 100);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isOpen, isPaused, currentIndex, currentStory]);

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
      setCurrentIndex(0);
      setProgress(0);
    }
  }, [currentIndex, stories.length, onClose]);

  const goToPrevious = useCallback(() => {
    if (progress > 10) {
      setProgress(0);
    } else if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  }, [currentIndex, progress]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setProgress(0);
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    setCurrentIndex(0);
    setProgress(0);
    setIsPaused(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    
    const touch = e.changedTouches[0];
    const screenWidth = window.innerWidth;
    
    if (touch.clientX < screenWidth / 3) {
      goToPrevious();
    } else if (touch.clientX > (screenWidth * 2) / 3) {
      goToNext();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  if (!hasStories || !isOpen || !currentStory) {
    return null;
  }

  // Only render the fullscreen viewer
  return (
    <div 
      className="fixed inset-0 z-50 bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 p-2 safe-area-inset-top">
        <div className="flex gap-1">
          {stories.map((_, index) => (
            <div 
              key={index}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div 
                className="h-full bg-white transition-all duration-100"
                style={{ 
                  width: index < currentIndex 
                    ? "100%" 
                    : index === currentIndex 
                      ? `${progress}%` 
                      : "0%" 
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4 safe-area-inset-top">
        <div className="flex items-center gap-3">
          {establishmentLogo && (
            <img 
              src={establishmentLogo}
              alt={establishmentName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
          )}
          <span className="text-white font-medium text-sm">{establishmentName}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {currentStory.videoUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
          <img
            src={currentStory.videoUrl}
            alt=""
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <video
            ref={videoRef}
            src={currentStory.videoUrl}
            className="w-full h-full object-contain"
            autoPlay
            playsInline
            muted={isMuted}
            loop
          />
        )}
      </div>

      {/* Navigation arrows (desktop) */}
      <div className="absolute inset-y-0 left-0 w-1/3 z-10 hidden md:flex items-center justify-start pl-4">
        {currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
      
      <div className="absolute inset-y-0 right-0 w-1/3 z-10 hidden md:flex items-center justify-end pr-4">
        {currentIndex < stories.length - 1 && (
          <button
            onClick={goToNext}
            className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Description */}
      {currentStory.description && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent safe-area-inset-bottom">
          <p className="text-white text-sm">{currentStory.description}</p>
        </div>
      )}
    </div>
  );
};

export default StoreStories;
