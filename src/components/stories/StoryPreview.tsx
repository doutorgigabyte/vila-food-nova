import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  ArrowLeft, 
  Upload,
  Volume2,
  VolumeX,
  Loader2,
  ShoppingBag,
  Music
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
}

interface ImageAdjustments {
  scale: number;
  positionX: number;
  positionY: number;
}

interface StoryPreviewProps {
  mediaUrl: string;
  mediaType: "video" | "image";
  description: string;
  musicUrl?: string | null;
  product?: Product | null;
  imageAdjustments?: ImageAdjustments;
  onBack: () => void;
  onPublish: () => void;
  isPublishing: boolean;
}

const StoryPreview = ({ 
  mediaUrl, 
  mediaType, 
  description, 
  musicUrl, 
  product,
  imageAdjustments,
  onBack, 
  onPublish,
  isPublishing 
}: StoryPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [musicLoaded, setMusicLoaded] = useState(false);

  // Always mute video when music is selected
  const hasMusic = !!musicUrl;

  // Handle music loading and playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (musicUrl) {
      audio.src = musicUrl;
      audio.loop = true;
      audio.load();
      
      const handleCanPlay = () => {
        setMusicLoaded(true);
        // Auto-play music when ready if video is playing
        if (isPlaying && !isMuted) {
          audio.play().catch(console.warn);
        }
      };
      
      const handleError = (e: Event) => {
        console.warn('Music failed to load:', musicUrl, e);
        setMusicLoaded(false);
      };
      
      audio.addEventListener('canplaythrough', handleCanPlay);
      audio.addEventListener('error', handleError);
      
      return () => {
        audio.removeEventListener('canplaythrough', handleCanPlay);
        audio.removeEventListener('error', handleError);
        audio.pause();
      };
    } else {
      audio.pause();
      audio.src = '';
      setMusicLoaded(false);
    }
  }, [musicUrl]);

  // Sync audio with play/mute state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !musicUrl) return;

    if (isPlaying && !isMuted && musicLoaded) {
      audio.play().catch(console.warn);
    } else {
      audio.pause();
    }
  }, [isPlaying, isMuted, musicUrl, musicLoaded]);

  // Auto-play video on mount
  useEffect(() => {
    if (mediaType === "video" && videoRef.current) {
      // Ensure video is muted when music is present
      videoRef.current.muted = hasMusic || isMuted;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  }, [mediaType, hasMusic]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaType !== "video") return;

    const handleTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleEnded = () => {
      video.currentTime = 0;
      video.play();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [mediaType]);

  // Auto-play image progress for preview
  useEffect(() => {
    if (mediaType !== "image") return;
    
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [mediaType, isPlaying]);

  const togglePlay = () => {
    if (mediaType === "video" && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    if (videoRef.current) {
      // Video stays muted if music is present
      videoRef.current.muted = hasMusic || newMuted;
    }
    if (audioRef.current && musicUrl) {
      if (newMuted) {
        audioRef.current.pause();
      } else if (isPlaying) {
        audioRef.current.play().catch(console.warn);
      }
    }
    setIsMuted(newMuted);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Audio element for music - always rendered */}
      <audio ref={audioRef} className="hidden" />

      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold mb-1">Preview do Story</h2>
        <p className="text-muted-foreground text-sm">
          Veja como seu story vai aparecer
        </p>
      </div>

      {/* Story Preview */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative aspect-[9/16] max-h-[60vh] w-full max-w-xs rounded-2xl overflow-hidden bg-black shadow-2xl">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 z-10 p-2">
            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Media */}
          {mediaType === "video" ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-cover"
              playsInline
              loop
              muted={hasMusic || isMuted}
              autoPlay
              onClick={togglePlay}
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Story preview"
              className="w-full h-full object-cover"
              style={imageAdjustments ? {
                transform: `scale(${imageAdjustments.scale})`,
                objectPosition: `${imageAdjustments.positionX}% ${imageAdjustments.positionY}%`
              } : undefined}
              onClick={togglePlay}
            />
          )}

          {/* Play/Pause overlay */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
            >
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-8 h-8 text-black ml-1" />
              </div>
            </button>
          )}

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            {/* Product Card */}
            {product && (
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{product.name}</p>
                  <p className="text-primary text-sm font-bold">
                    {formatPrice(product.promotional_price || product.price)}
                  </p>
                </div>
                <Button size="sm" className="h-8 text-xs">
                  Ver
                </Button>
              </div>
            )}

            {/* Description */}
            {description && (
              <p className="text-white text-sm mb-3 line-clamp-2">
                {description}
              </p>
            )}

            {/* Audio controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Music indicator */}
          {musicUrl && (
            <div className={cn(
              "absolute top-12 right-2 flex items-center gap-1 px-2 py-1 rounded-full",
              musicLoaded ? "bg-primary/80" : "bg-black/50"
            )}>
              <Music className={cn(
                "w-3 h-3 text-white",
                isPlaying && musicLoaded && "animate-pulse"
              )} />
              <span className="text-white text-xs">
                {musicLoaded ? "♫" : "..."}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex-1"
          disabled={isPublishing}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={onPublish}
          disabled={isPublishing}
          className="flex-1 bg-gradient-to-r from-primary to-primary/80"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Publicar Story
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StoryPreview;
