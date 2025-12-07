import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/s3';

const STORY_DURATION = 15000; // 15 seconds in ms
const PROGRESS_INTERVAL = 50; // Update progress every 50ms for smooth animation
const LONG_PRESS_DELAY = 300; // ms to trigger long press

interface VilaTokPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  musicUrl?: string | null;
  isActive: boolean;
  autoAdvance?: boolean;
  onViewCountIncrement?: () => void;
  onVideoEnd?: () => void;
  onAutoAdvance?: () => void;
  onProgressUpdate?: (progress: number) => void;
  onTapLeft?: () => void;
  onTapRight?: () => void;
  onSwipeToProfile?: () => void;
}

// Check if URL is an image (not a video)
const isImageUrl = (url: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
         lowerUrl.includes('unsplash.com') ||
         lowerUrl.includes('images.');
};

export function VilaTokPlayer({
  videoUrl,
  thumbnailUrl,
  musicUrl,
  isActive,
  autoAdvance = true,
  onViewCountIncrement,
  onVideoEnd,
  onAutoAdvance,
  onProgressUpdate,
  onTapLeft,
  onTapRight,
  onSwipeToProfile,
}: VilaTokPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [hasCountedView, setHasCountedView] = useState(false);
  const [hasMusicPlaying, setHasMusicPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Determine if URL is an image
  const isImage = useMemo(() => isImageUrl(videoUrl), [videoUrl]);

  // Clear progress interval
  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Start countdown timer - progress fills UP (0 to 100)
  const startProgressTimer = useCallback(() => {
    clearProgressInterval();
    startTimeRef.current = Date.now() - pausedAtRef.current;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(100, (elapsed / STORY_DURATION) * 100);
      
      onProgressUpdate?.(progress);

      // Auto-advance when progress reaches 100%
      if (progress >= 100) {
        clearProgressInterval();
        pausedAtRef.current = 0;
        if (autoAdvance && onAutoAdvance) {
          onAutoAdvance();
        }
      }
    }, PROGRESS_INTERVAL);
  }, [autoAdvance, onAutoAdvance, onProgressUpdate, clearProgressInterval]);

  // Load video when it becomes active or nearby
  useEffect(() => {
    if (isImage || !videoRef.current) return;
    
    if (!videoLoaded) {
      videoRef.current.load();
      setVideoLoaded(true);
    }
  }, [videoLoaded, isImage]);

  // Auto-play and countdown when active
  useEffect(() => {
    if (isActive && !isPaused) {
      setHasCountedView(false);
      pausedAtRef.current = 0;
      onProgressUpdate?.(0);
      startProgressTimer();
      setIsPlaying(true);

      if (!isImage && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }

      if (audioRef.current && musicUrl) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(() => {});
        setHasMusicPlaying(true);
      }
    } else {
      setIsPlaying(false);
      clearProgressInterval();
      
      if (!isPaused) {
        pausedAtRef.current = 0;
      }

      if (!isImage && videoRef.current) {
        videoRef.current.pause();
        if (!isPaused) {
          videoRef.current.currentTime = 0;
        }
      }

      if (audioRef.current) {
        audioRef.current.pause();
        if (!isPaused) {
          audioRef.current.currentTime = 0;
        }
        setHasMusicPlaying(false);
      }
    }

    return () => {
      clearProgressInterval();
    };
  }, [isActive, isPaused, musicUrl, isImage, startProgressTimer, clearProgressInterval, onProgressUpdate]);

  // Count view after 3 seconds of playback
  useEffect(() => {
    if (!isPlaying || hasCountedView || !onViewCountIncrement) return;

    const timer = setTimeout(() => {
      onViewCountIncrement();
      setHasCountedView(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPlaying, hasCountedView, onViewCountIncrement]);

  const handleVideoEnd = useCallback(() => {
    onVideoEnd?.();
  }, [onVideoEnd]);

  // Touch/Click handling for tap zones and long press
  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    touchStartRef.current = {
      x: clientX,
      y: clientY,
      time: Date.now()
    };

    // Long press detection - pause the video
    longPressTimerRef.current = setTimeout(() => {
      setIsPaused(true);
      pausedAtRef.current = Date.now() - startTimeRef.current;
      clearProgressInterval();
      
      if (!isImage && videoRef.current) {
        videoRef.current.pause();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }, LONG_PRESS_DELAY);
  }, [isImage, clearProgressInterval]);

  const handleTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // If was paused by long press, resume
    if (isPaused) {
      setIsPaused(false);
      startProgressTimer();
      
      if (!isImage && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
      if (audioRef.current && musicUrl) {
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    if (!touchStartRef.current) return;

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    
    const deltaX = clientX - touchStartRef.current.x;
    const deltaY = clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Check for horizontal swipe left (go to profile)
    if (deltaX < -80 && Math.abs(deltaY) < 50 && deltaTime < 500) {
      onSwipeToProfile?.();
      touchStartRef.current = null;
      return;
    }

    // Check if it's a tap (not a swipe)
    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30 && deltaTime < LONG_PRESS_DELAY) {
      const screenWidth = window.innerWidth;
      const tapX = clientX;

      // Left 30% = go back
      if (tapX < screenWidth * 0.3) {
        onTapLeft?.();
      }
      // Right 30% = go forward
      else if (tapX > screenWidth * 0.7) {
        onTapRight?.();
      }
      // Center = toggle play/pause with visual feedback
      else {
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 500);

        if (isPlaying) {
          setIsPlaying(false);
          pausedAtRef.current = Date.now() - startTimeRef.current;
          clearProgressInterval();
          if (!isImage && videoRef.current) {
            videoRef.current.pause();
          }
          if (audioRef.current) {
            audioRef.current.pause();
          }
        } else {
          setIsPlaying(true);
          startProgressTimer();
          if (!isImage && videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
          if (audioRef.current && musicUrl) {
            audioRef.current.play().catch(() => {});
          }
        }
      }
    }

    touchStartRef.current = null;
  }, [isPaused, isPlaying, isImage, musicUrl, onTapLeft, onTapRight, onSwipeToProfile, startProgressTimer, clearProgressInterval]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleMusic = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    
    if (hasMusicPlaying) {
      audioRef.current.pause();
      setHasMusicPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setHasMusicPlaying(true);
    }
  }, [hasMusicPlaying]);

  return (
    <div 
      className="relative w-full h-full bg-black vilatok-slide select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      {/* Render image or video based on URL type */}
      {isImage ? (
        <img
          src={videoUrl}
          alt="Story"
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl ? getImageUrl(thumbnailUrl) : undefined}
          className="w-full h-full object-cover"
          muted={isMuted}
          playsInline
          preload={isActive ? "auto" : "metadata"}
          loop
          onEnded={handleVideoEnd}
        />
      )}

      {/* Background Music */}
      {musicUrl && (
        <audio
          ref={audioRef}
          src={musicUrl}
          loop
          preload="none"
        />
      )}

      {/* Play/Pause indicator */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200",
          showPlayIcon ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
          {isPlaying ? (
            <Pause className="w-10 h-10 text-white" />
          ) : (
            <Play className="w-10 h-10 text-white ml-1" />
          )}
        </div>
      </div>

      {/* Long Press Pause Indicator */}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-black/40 backdrop-blur-sm rounded-full p-4">
            <Pause className="w-8 h-8 text-white/80" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-24 right-4 flex flex-col gap-2 z-30">
        {/* Mute button - only for videos */}
        {!isImage && (
          <button
            onClick={toggleMute}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        )}

        {/* Music toggle button */}
        {musicUrl && (
          <button
            onClick={toggleMusic}
            className={cn(
              "w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors border border-white/10",
              hasMusicPlaying ? "bg-primary/80" : "bg-black/40"
            )}
          >
            <Music className={cn(
              "w-5 h-5",
              hasMusicPlaying ? "text-primary-foreground" : "text-white"
            )} />
          </button>
        )}
      </div>

      {/* Gradient overlays - Enhanced bottom shadow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
      </div>
    </div>
  );
}
