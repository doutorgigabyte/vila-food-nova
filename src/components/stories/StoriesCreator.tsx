import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Video, 
  Image, 
  X,
  Check,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import VideoTrimmer from "./VideoTrimmer";
import MusicSelector from "./MusicSelector";
import StoryPreview from "./StoryPreview";
import { uploadVideoToS3, uploadToS3 } from "@/lib/s3";

interface StoriesCreatorProps {
  establishmentId: string;
  onClose: () => void;
  onPublish: (storyData: StoryData) => Promise<void>;
}

export interface StoryData {
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  musicUrl?: string;
  duration: number;
  displayInStore: boolean;
  displayInMarketplace: boolean;
}

type Step = "upload" | "trim" | "music" | "details" | "preview";

const StoriesCreator = ({ establishmentId, onClose, onPublish }: StoriesCreatorProps) => {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>("");
  const [mediaType, setMediaType] = useState<"video" | "image" | null>(null);
  const [trimmedVideoBlob, setTrimmedVideoBlob] = useState<Blob | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string>("");
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [displayInStore, setDisplayInStore] = useState(true);
  const [displayInMarketplace, setDisplayInMarketplace] = useState(true);
  const [duration, setDuration] = useState(15);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Limite: 50MB");
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast.error("Formato não suportado. Use vídeo ou imagem.");
      return;
    }

    setMediaFile(file);
    setMediaType(isVideo ? "video" : "image");
    setMediaPreviewUrl(URL.createObjectURL(file));
    
    // For images, skip to details; for videos, go to trim
    setCurrentStep(isVideo ? "trim" : "details");
  }, []);

  const handleTrimComplete = useCallback((blob: Blob, thumbnail: string, videoDuration: number) => {
    setTrimmedVideoBlob(blob);
    setThumbnailPreviewUrl(thumbnail);
    setDuration(videoDuration);
    
    // Convert thumbnail data URL to blob
    fetch(thumbnail)
      .then(res => res.blob())
      .then(thumbnailBlob => {
        setThumbnailBlob(thumbnailBlob);
      });
    
    setCurrentStep("music");
  }, []);

  const handleMusicSelect = useCallback((musicUrl: string | null) => {
    setSelectedMusic(musicUrl);
    setCurrentStep("details");
  }, []);

  const handleDetailsComplete = useCallback(() => {
    setCurrentStep("preview");
  }, []);

  const handlePublish = async () => {
    if (!mediaFile && !trimmedVideoBlob) return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      let videoUrl: string;
      let thumbnailUrl: string;

      // Upload video to S3
      if (mediaType === "video") {
        const videoToUpload = trimmedVideoBlob 
          ? new File([trimmedVideoBlob], 'video.mp4', { type: 'video/mp4' })
          : mediaFile!;
        
        setUploadProgress(10);
        const videoResult = await uploadVideoToS3(videoToUpload, establishmentId);
        videoUrl = videoResult.url;
        setUploadProgress(60);

        // Upload thumbnail
        if (thumbnailBlob) {
          const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' });
          const thumbResult = await uploadToS3(thumbnailFile, 'videos', establishmentId);
          thumbnailUrl = thumbResult.url;
        } else {
          thumbnailUrl = thumbnailPreviewUrl;
        }
        setUploadProgress(80);
      } else {
        // For images, upload directly
        setUploadProgress(10);
        const imageResult = await uploadToS3(mediaFile!, 'videos', establishmentId);
        videoUrl = imageResult.url;
        thumbnailUrl = imageResult.url;
        setUploadProgress(80);
      }

      const storyData: StoryData = {
        videoUrl,
        thumbnailUrl,
        description,
        musicUrl: selectedMusic || undefined,
        duration: mediaType === "image" ? 5 : duration,
        displayInStore,
        displayInMarketplace,
      };

      setUploadProgress(90);
      await onPublish(storyData);
      setUploadProgress(100);
      
      toast.success("Story publicado com sucesso!");
      onClose();
    } catch (error) {
      console.error("Error publishing story:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao publicar story");
    } finally {
      setIsProcessing(false);
    }
  };

  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "trim", label: "Cortar" },
    { key: "music", label: "Música" },
    { key: "details", label: "Detalhes" },
    { key: "preview", label: "Preview" },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center touch-feedback active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-lg">Criar Story</h1>
        <div className="w-10" />
      </div>

      {/* Progress Steps */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div 
              key={step.key}
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                index <= currentStepIndex ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                index < currentStepIndex 
                  ? "bg-primary text-primary-foreground" 
                  : index === currentStepIndex 
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
              )}>
                {index < currentStepIndex ? <Check className="w-3 h-3" /> : index + 1}
              </div>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          ))}
        </div>
        <Progress value={(currentStepIndex / (steps.length - 1)) * 100} className="h-1" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Upload Step */}
        {currentStep === "upload" && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Adicionar Mídia</h2>
              <p className="text-muted-foreground text-sm">
                Escolha um vídeo (máx 15s) ou foto para seu story
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-dashed border-primary/30 hover:border-primary transition-colors touch-feedback active:scale-95"
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Video className="w-8 h-8 text-primary" />
                </div>
                <span className="font-medium">Vídeo</span>
                <span className="text-xs text-muted-foreground">MP4, MOV, WebM</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border-2 border-dashed border-secondary/30 hover:border-secondary transition-colors touch-feedback active:scale-95"
              >
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Image className="w-8 h-8 text-secondary-foreground" />
                </div>
                <span className="font-medium">Foto</span>
                <span className="text-xs text-muted-foreground">JPG, PNG, WebP</span>
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Tamanho máximo: 50MB
            </p>
          </div>
        )}

        {/* Trim Step */}
        {currentStep === "trim" && mediaPreviewUrl && (
          <VideoTrimmer
            videoUrl={mediaPreviewUrl}
            maxDuration={15}
            onTrimComplete={handleTrimComplete}
            onBack={() => setCurrentStep("upload")}
          />
        )}

        {/* Music Step */}
        {currentStep === "music" && (
          <MusicSelector
            selectedMusic={selectedMusic}
            onSelect={handleMusicSelect}
            onSkip={() => setCurrentStep("details")}
            onBack={() => setCurrentStep("trim")}
          />
        )}

        {/* Details Step */}
        {currentStep === "details" && (
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Detalhes do Story</h2>
              <p className="text-muted-foreground text-sm">
                Adicione uma descrição e configure onde exibir
              </p>
            </div>

            {/* Preview thumbnail */}
            <div className="aspect-[9/16] max-h-48 rounded-xl overflow-hidden bg-muted mx-auto">
              {mediaType === "video" ? (
                <video 
                  src={trimmedVideoBlob ? URL.createObjectURL(trimmedVideoBlob) : mediaPreviewUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <img 
                  src={mediaPreviewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva seu story..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 280))}
                  className="mt-1 resize-none"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {description.length}/280
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <Label htmlFor="store-toggle" className="font-medium">Mostrar na Loja</Label>
                    <p className="text-xs text-muted-foreground">Exibir no cardápio digital</p>
                  </div>
                  <Switch
                    id="store-toggle"
                    checked={displayInStore}
                    onCheckedChange={setDisplayInStore}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <Label htmlFor="marketplace-toggle" className="font-medium">Mostrar no Marketplace</Label>
                    <p className="text-xs text-muted-foreground">Exibir na página inicial</p>
                  </div>
                  <Switch
                    id="marketplace-toggle"
                    checked={displayInMarketplace}
                    onCheckedChange={setDisplayInMarketplace}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(mediaType === "video" ? "music" : "upload")}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button 
                onClick={handleDetailsComplete}
                className="flex-1"
              >
                Preview
              </Button>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {currentStep === "preview" && (
          <StoryPreview
            mediaUrl={trimmedVideoBlob ? URL.createObjectURL(trimmedVideoBlob) : mediaPreviewUrl}
            mediaType={mediaType || "image"}
            description={description}
            musicUrl={selectedMusic}
            onBack={() => setCurrentStep("details")}
            onPublish={handlePublish}
            isPublishing={isProcessing}
          />
        )}
      </div>

      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center max-w-xs">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="font-medium">Publicando story...</p>
            <p className="text-sm text-muted-foreground mb-4">Fazendo upload dos arquivos</p>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">{uploadProgress}%</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesCreator;
