import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Scissors, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoTrimmerProps {
  videoUrl: string;
  maxDuration: number;
  onTrimComplete: (blob: Blob, thumbnail: string, duration: number) => void;
  onBack: () => void;
}

const VideoTrimmer = ({ videoUrl, maxDuration, onTrimComplete, onBack }: VideoTrimmerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(maxDuration);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setEndTime(Math.min(video.duration, maxDuration));
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Loop within the selected range
      if (video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [startTime, endTime, maxDuration]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      if (video.currentTime < startTime || video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, startTime, endTime]);

  const handleRangeChange = useCallback((values: number[]) => {
    const [start, end] = values;
    const newEnd = Math.min(start + maxDuration, end, duration);
    
    setStartTime(start);
    setEndTime(newEnd);
    
    if (videoRef.current) {
      videoRef.current.currentTime = start;
    }
  }, [maxDuration, duration]);

  const generateThumbnail = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        resolve("");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("");
        return;
      }

      video.currentTime = startTime;
      
      setTimeout(() => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      }, 100);
    });
  }, [startTime]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    
    try {
      // Generate thumbnail
      const thumbnail = await generateThumbnail();
      
      // For now, we'll pass the original video
      // In production, we'd use FFmpeg WASM to actually trim the video
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      
      const trimDuration = endTime - startTime;
      onTrimComplete(blob, thumbnail, trimDuration);
    } catch (error) {
      console.error("Error processing video:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const trimDuration = endTime - startTime;
  const isWithinLimit = trimDuration <= maxDuration;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold mb-1">Cortar Vídeo</h2>
        <p className="text-muted-foreground text-sm">
          Selecione até {maxDuration} segundos do vídeo
        </p>
      </div>

      {/* Video Preview */}
      <div className="flex-1 flex items-center justify-center mb-4">
        <div className="relative aspect-[9/16] max-h-[50vh] rounded-xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            playsInline
            muted
            onClick={togglePlay}
          />
          
          {/* Play/Pause overlay */}
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity touch-feedback"
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-8 h-8 text-black" />
              ) : (
                <Play className="w-8 h-8 text-black ml-1" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Timeline Controls */}
      <div className="space-y-4 px-2">
        {/* Current time display */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <span className={cn(
            "font-medium",
            isWithinLimit ? "text-primary" : "text-destructive"
          )}>
            Selecionado: {formatTime(trimDuration)}
          </span>
        </div>

        {/* Range slider */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Arraste para selecionar o trecho</span>
          </div>
          
          <Slider
            value={[startTime, endTime]}
            min={0}
            max={duration}
            step={0.1}
            onValueChange={handleRangeChange}
            className="touch-feedback"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Início: {formatTime(startTime)}</span>
            <span>Fim: {formatTime(endTime)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={!isWithinLimit || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>Processando...</>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Confirmar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default VideoTrimmer;
