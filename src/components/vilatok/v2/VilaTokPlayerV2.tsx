import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/s3";

/**
 * Player Vilatok V2 — PURO. Sem gesture handling.
 * - Renderiza video/imagem com autoplay quando isActive
 * - Audio de musica de fundo opcional
 * - Botoes de mute/play sao internos com pointer-events: auto
 * - Pausa controlada externamente via `isPaused` prop (long press, sheet aberto, etc)
 * - Reporta progresso via onProgressUpdate, auto-advance ao terminar
 *
 * NAO faz mais: tap zonal, swipe horizontal/vertical, pull-to-profile.
 * Isso vive agora no `VilaTokFeedV2` que usa `useVilaTokGestures`.
 */

const STORY_DURATION = 15_000;
const PROGRESS_INTERVAL = 50;
const VIEW_COUNT_THRESHOLD = 3_000;

export interface VilaTokPlayerV2Props {
  videoUrl: string;
  thumbnailUrl?: string | null;
  musicUrl?: string | null;
  isActive: boolean;
  /** Pausa externa: long press, sheet aberto, comments aberto. */
  isPaused?: boolean;
  /** Mostrar UI de mute? default true. */
  showMuteButton?: boolean;
  onProgressUpdate?: (progress: number) => void;
  onAutoAdvance?: () => void;
  onViewCountIncrement?: () => void;
}

const isImageUrl = (url: string): boolean => {
  const lower = url.toLowerCase();
  return (
    [".jpg", ".jpeg", ".png", ".gif", ".webp"].some((ext) => lower.includes(ext)) ||
    lower.includes("unsplash.com")
  );
};

export function VilaTokPlayerV2({
  videoUrl,
  thumbnailUrl,
  musicUrl,
  isActive,
  isPaused = false,
  showMuteButton = true,
  onProgressUpdate,
  onAutoAdvance,
  onViewCountIncrement,
}: VilaTokPlayerV2Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const viewCountedRef = useRef(false);
  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);

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
  }, [clearProgress, onAutoAdvance, onProgressUpdate]);

  // Lifecycle: ativacao, pausa, swap de video
  useEffect(() => {
    if (!isActive) {
      clearProgress();
      pausedAtRef.current = 0;
      if (!isImage) videoRef.current?.pause();
      audioRef.current?.pause();
      if (videoRef.current && !isImage) videoRef.current.currentTime = 0;
      if (audioRef.current) audioRef.current.currentTime = 0;
      viewCountedRef.current = false;
      return;
    }

    if (isPaused) {
      // Pause externo — preserva pausedAt e mantem currentTime
      clearProgress();
      pausedAtRef.current = Date.now() - startTimeRef.current;
      if (!isImage) videoRef.current?.pause();
      audioRef.current?.pause();
      return;
    }

    // Active + not paused: play
    onProgressUpdate?.(0);
    pausedAtRef.current = 0;
    startProgress();

    if (!isImage && videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(() => setHasError(true));
          }
        });
      }
    }

    if (audioRef.current && musicUrl) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    }

    // View count: dispara depois de 3s assistidos
    if (onViewCountIncrement && !viewCountedRef.current) {
      viewTimerRef.current = setTimeout(() => {
        onViewCountIncrement();
        viewCountedRef.current = true;
      }, VIEW_COUNT_THRESHOLD);
    }

    return () => {
      clearProgress();
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
        viewTimerRef.current = null;
      }
    };
  }, [
    isActive,
    isPaused,
    isImage,
    musicUrl,
    startProgress,
    clearProgress,
    onProgressUpdate,
    onViewCountIncrement,
  ]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  return (
    <div
      className="relative w-full h-full bg-black vt-gpu"
      data-vt-player
      style={{ aspectRatio: "9/16" }}
    >
      {isImage ? (
        <img
          src={videoUrl}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl ? getImageUrl(thumbnailUrl) : undefined}
          className="w-full h-full object-cover"
          muted={isMuted}
          playsInline
          autoPlay={isActive && !isPaused}
          preload={isActive ? "auto" : "metadata"}
          loop
          onError={() => setHasError(true)}
        />
      )}

      {musicUrl && <audio ref={audioRef} src={musicUrl} loop preload="none" />}

      {/* Pause overlay quando isPaused vem de fora */}
      <AnimatePresence>
        {isPaused && isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: "var(--vt-z-overlay)" as never }}
          >
            <div className="vt-glass-elevated rounded-full p-5">
              <Pause className="w-9 h-9 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute button — pointer-events isolado pra gesture controller ignorar */}
      {!isImage && showMuteButton && (
        <button
          onClick={toggleMute}
          className="vt-touch absolute top-24 right-4 vt-glass rounded-full flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
          style={{ zIndex: "var(--vt-z-sidebar)" as never }}
          aria-label={isMuted ? "Ativar som" : "Desativar som"}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white/70 gap-2">
          <Play className="w-12 h-12 opacity-40" />
          <p className="text-sm">Vídeo indisponível</p>
        </div>
      )}

      {/* Gradients pra legibilidade */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
      </div>
    </div>
  );
}
