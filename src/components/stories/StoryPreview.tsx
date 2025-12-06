import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  ArrowLeft, 
  Upload,
  Volume2,
  VolumeX,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryPreviewProps {
  mediaUrl: string;
  mediaType: "video" | "image";
  description: string;
  musicUrl?: string | null;
  onBack: () => void;
  onPublish: () => void;
  isPublishing: boolean;
}

const StoryPreview = ({ 
  mediaUrl, 
  mediaType, 
  description, 
  musicUrl, 
  onBack, 
  onPublish,
  isPublishing 
}: StoryPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

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

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
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
          return prev + 2; // 5 seconds total (100 / 2 = 50 steps, 100ms each = 5s)
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
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex flex-col h-full">
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
              muted={isMuted}
              onClick={togglePlay}
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Story preview"
              className="w-full h-full object-cover"
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

              {mediaType === "video" && (
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
              )}
            </div>
          </div>

          {/* Music indicator */}
          {musicUrl && (
            <div className="absolute top-12 right-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
              <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
              <span className="text-white text-xs">🎵</span>
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
