import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/s3';
import { VilaTokPullToProfile } from './VilaTokPullToProfile';

const STORY_DURATION = 15000;
const PROGRESS_INTERVAL = 50;
const LONG_PRESS_DELAY = 300;
const PULL_THRESHOLD = 120; // pixels to trigger profile open

interface VilaTokPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  musicUrl?: string | null;
  isActive: boolean;
  isLastVideo?: boolean;
  establishmentSlug?: string;
  onViewCountIncrement?: () => void;
  onVideoEnd?: () => void;
  onAutoAdvance?: () => void;
  onProgressUpdate?: (progress: number) => void;
  onTapLeft?: () => void;
  onTapRight?: () => void;
  onSwipeToProfile?: () => void;
}

const isImageUrl = (url: string): boolean => {
  const lower = url.toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(ext => lower.includes(ext)) || 
         lower.includes('unsplash.com');
};

export function VilaTokPlayer({
  videoUrl,
  thumbnailUrl,
  musicUrl,
  isActive,
  isLastVideo = false,
  establishmentSlug,
  onViewCountIncrement,
  onAutoAdvance,
  onProgressUpdate,
  onTapLeft,
  onTapRight,
  onSwipeToProfile,
}: VilaTokPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [hasCountedView, setHasCountedView] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const isImage = useMemo(() => isImageUrl(videoUrl), [videoUrl]);

  const clearProgress = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    clearProgress();
    startTimeRef.current = Date.now() - pausedAtRef.current;

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(100, (elapsed / STORY_DURATION) * 100);
      onProgressUpdate?.(progress);

      if (progress >= 100) {
        clearProgress();
        pausedAtRef.current = 0;
        onAutoAdvance?.();
      }
    }, PROGRESS_INTERVAL);
  }, [onAutoAdvance, onProgressUpdate, clearProgress]);

  useEffect(() => {
    if (isActive && !isPaused) {
      setHasCountedView(false);
      pausedAtRef.current = 0;
      onProgressUpdate?.(0);
      startProgress();
      setIsPlaying(true);

      if (!isImage && videoRef.current) {
        videoRef.current.currentTime = 0;
        // Force autoplay with user gesture simulation
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => {
              // Autoplay blocked - set muted and retry
              if (videoRef.current) {
                videoRef.current.muted = true;
                setIsMuted(true);
                videoRef.current.play().catch(() => setIsPlaying(false));
              }
            });
        }
      }

      if (audioRef.current && musicUrl) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(() => {});
      }
    } else {
      setIsPlaying(false);
      clearProgress();
      
      if (!isPaused) pausedAtRef.current = 0;

      if (!isImage && videoRef.current) {
        videoRef.current.pause();
        if (!isPaused) videoRef.current.currentTime = 0;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        if (!isPaused) audioRef.current.currentTime = 0;
      }
    }

    return clearProgress;
  }, [isActive, isPaused, musicUrl, isImage, startProgress, clearProgress, onProgressUpdate]);

  useEffect(() => {
    if (!isPlaying || hasCountedView || !onViewCountIncrement) return;
    const timer = setTimeout(() => {
      onViewCountIncrement();
      setHasCountedView(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isPlaying, hasCountedView, onViewCountIncrement]);

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Ignorar se o clique foi em um botão, elemento interativo ou área da sidebar
    if (
      target.closest('button') || 
      target.closest('[role="button"]') || 
      target.closest('a') ||
      target.closest('[data-vilatok-sidebar]') ||
      window.getComputedStyle(target).zIndex === '60' ||
      parseInt(window.getComputedStyle(target).zIndex || '0') >= 60
    ) {
      return;
    }
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Verificar se o clique está na área da sidebar (direita da tela)
    const screenWidth = window.innerWidth;
    if (clientX > screenWidth * 0.75) {
      return;
    }
    
    touchStartRef.current = { x: clientX, y: clientY, time: Date.now() };

    longPressRef.current = setTimeout(() => {
      setIsPaused(true);
      pausedAtRef.current = Date.now() - startTimeRef.current;
      clearProgress();
      videoRef.current?.pause();
      audioRef.current?.pause();
    }, LONG_PRESS_DELAY);
  }, [clearProgress]);

  const handleTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Ignorar se o clique foi em um botão, elemento interativo ou área da sidebar
    if (
      target.closest('button') || 
      target.closest('[role="button"]') || 
      target.closest('a') ||
      target.closest('[data-vilatok-sidebar]') ||
      window.getComputedStyle(target).zIndex === '60' ||
      parseInt(window.getComputedStyle(target).zIndex || '0') >= 60
    ) {
      return;
    }
    
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }

    if (isPaused) {
      setIsPaused(false);
      startProgress();
      if (!isImage) videoRef.current?.play().catch(() => {});
      if (musicUrl) audioRef.current?.play().catch(() => {});
      return;
    }

    if (!touchStartRef.current) return;

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    
    // Verificar se o clique está na área da sidebar (direita da tela)
    const screenWidth = window.innerWidth;
    if (clientX > screenWidth * 0.75) {
      return;
    }
    
    const deltaX = clientX - touchStartRef.current.x;
    const deltaY = clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Handle pull to profile on last video
    if (isLastVideo && deltaX < -30 && Math.abs(deltaY) < 50) {
      const progress = Math.min(100, (Math.abs(deltaX) / PULL_THRESHOLD) * 100);
      setPullProgress(progress);
      setIsPulling(true);
      
      if (Math.abs(deltaX) >= PULL_THRESHOLD) {
        setPullProgress(0);
        setIsPulling(false);
        onSwipeToProfile?.();
        touchStartRef.current = null;
        return;
      }
    }

    // Regular swipe to profile (quick gesture)
    if (deltaX < -80 && Math.abs(deltaY) < 50 && deltaTime < 500 && !isLastVideo) {
      onSwipeToProfile?.();
      touchStartRef.current = null;
      return;
    }

    // Reset pull progress if not pulling
    if (isPulling && (deltaX >= -30 || Math.abs(deltaY) >= 50)) {
      setPullProgress(0);
      setIsPulling(false);
    }

    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30 && deltaTime < LONG_PRESS_DELAY) {
      const screenWidth = window.innerWidth;
      
      if (clientX < screenWidth * 0.3) {
        onTapLeft?.();
      } else if (clientX > screenWidth * 0.7) {
        onTapRight?.();
      } else {
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 500);

        if (isPlaying) {
          setIsPlaying(false);
          pausedAtRef.current = Date.now() - startTimeRef.current;
          clearProgress();
          videoRef.current?.pause();
          audioRef.current?.pause();
        } else {
          setIsPlaying(true);
          startProgress();
          if (!isImage) videoRef.current?.play().catch(() => {});
          if (musicUrl) audioRef.current?.play().catch(() => {});
        }
      }
    }

    // Reset pull state
    setPullProgress(0);
    setIsPulling(false);
    
    touchStartRef.current = null;
  }, [isPaused, isPlaying, isImage, musicUrl, onTapLeft, onTapRight, onSwipeToProfile, startProgress, clearProgress, isLastVideo, isPulling]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  return (
    <div 
      className="relative w-full h-full bg-black select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      style={{ aspectRatio: '9/16' }}
    >
      {isImage ? (
        <img 
          src={videoUrl} 
          alt="" 
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
          autoPlay={isActive}
          preload={isActive ? "auto" : "metadata"}
          loop
        />
      )}

      {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="none" />}

      {/* Play/Pause indicator */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200",
        showPlayIcon ? "opacity-100" : "opacity-0"
      )}>
        <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
          {isPlaying ? <Pause className="w-10 h-10 text-white" /> : <Play className="w-10 h-10 text-white ml-1" />}
        </div>
      </div>

      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-black/40 rounded-full p-4">
            <Pause className="w-8 h-8 text-white/80" />
          </div>
        </div>
      )}

      {/* Mute button */}
      {!isImage && (
        <button
          onClick={toggleMute}
          className="absolute top-24 right-4 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center z-30"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
        </button>
      )}

      {/* Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
      </div>

      {/* Pull to Profile indicator */}
      <VilaTokPullToProfile
        progress={pullProgress}
        isVisible={isLastVideo && (isPulling || pullProgress > 0)}
        establishmentName={establishmentSlug}
      />
    </div>
  );
}