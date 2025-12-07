import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/s3';

const STORY_DURATION = 15000; // 15 seconds in ms
const PROGRESS_INTERVAL = 50; // Update progress every 50ms for smooth animation

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
}

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
}: VilaTokPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [hasCountedView, setHasCountedView] = useState(false);
  const [hasMusicPlaying, setHasMusicPlaying] = useState(false);

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

  // Auto-play and countdown when active
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
      setHasCountedView(false);
      pausedAtRef.current = 0;
      onProgressUpdate?.(0);
      startProgressTimer();

      // Start music if available
      if (audioRef.current && musicUrl) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(() => {});
        setHasMusicPlaying(true);
      }
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      clearProgressInterval();
      pausedAtRef.current = 0;

      // Stop music
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setHasMusicPlaying(false);
      }
    }

    return () => {
      clearProgressInterval();
    };
  }, [isActive, musicUrl, startProgressTimer, clearProgressInterval, onProgressUpdate]);

  // Count view after 3 seconds of playback
  useEffect(() => {
    if (!isPlaying || hasCountedView || !onViewCountIncrement) return;

    const timer = setTimeout(() => {
      onViewCountIncrement();
      setHasCountedView(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPlaying, hasCountedView, onViewCountIncrement]);

  // Handle video end (if video is shorter than 15s)
  const handleVideoEnd = useCallback(() => {
    onVideoEnd?.();
  }, [onVideoEnd]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 500);
      
      // Pause the timer and save elapsed time
      const elapsed = Date.now() - startTimeRef.current;
      pausedAtRef.current = elapsed;
      clearProgressInterval();

      // Pause music too
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 500);
      
      // Resume from where we paused
      startProgressTimer();

      // Resume music
      if (audioRef.current && musicUrl) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [isPlaying, musicUrl, startProgressTimer, clearProgressInterval]);

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
      className="relative w-full h-full bg-black"
      onClick={togglePlay}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl ? getImageUrl(thumbnailUrl) : undefined}
        className="w-full h-full object-cover"
        muted={isMuted}
        playsInline
        preload="auto"
        loop
        onEnded={handleVideoEnd}
      />

      {/* Background Music */}
      {musicUrl && (
        <audio
          ref={audioRef}
          src={musicUrl}
          loop
          preload="auto"
        />
      )}

      {/* Play/Pause indicator */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300",
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

      {/* Controls */}
      <div className="absolute top-24 right-4 flex flex-col gap-2 z-30">
        {/* Mute button */}
        <button
          onClick={toggleMute}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Music toggle button */}
        {musicUrl && (
          <button
            onClick={toggleMusic}
            className={cn(
              "w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors",
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

      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />
      </div>
    </div>
  );
}
