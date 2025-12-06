import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/s3';

interface VilaTokPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  isActive: boolean;
  onViewCountIncrement?: () => void;
}

export function VilaTokPlayer({
  videoUrl,
  thumbnailUrl,
  isActive,
  onViewCountIncrement,
}: VilaTokPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [hasCountedView, setHasCountedView] = useState(false);

  // Auto-play when active
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked, show play button
        setIsPlaying(false);
      });
      setIsPlaying(true);
      setHasCountedView(false);
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  // Count view after 3 seconds of playback
  useEffect(() => {
    if (!isPlaying || hasCountedView || !onViewCountIncrement) return;

    const timer = setTimeout(() => {
      onViewCountIncrement();
      setHasCountedView(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPlaying, hasCountedView, onViewCountIncrement]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 500);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 500);
    }
  }, [isPlaying]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

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
        loop
        muted={isMuted}
        playsInline
        preload="auto"
      />

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

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="absolute top-20 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center z-30"
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />
      </div>
    </div>
  );
}
