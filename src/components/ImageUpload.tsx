import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadToS3, validateFile, UploadType } from "@/lib/s3";

interface ImageUploadProps {
  bucket: UploadType;
  currentImage?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  aspectRatio?: "square" | "banner" | "auto";
  establishmentId?: string;
}

export const ImageUpload = ({
  bucket,
  currentImage,
  onUpload,
  onRemove,
  className,
  aspectRatio = "square",
  establishmentId,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync preview with currentImage when it changes
  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const aspectClasses = {
    square: "aspect-square",
    banner: "aspect-[3/1]",
    auto: "",
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = bucket === "avatars" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    const validation = validateFile(file, { maxSize });
    
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Upload to S3
      const result = await uploadToS3(file, bucket, establishmentId);

      onUpload(result.url);
      toast.success("Imagem enviada com sucesso!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Upload error:", errorMessage);
      toast.error("Erro ao enviar imagem. Tente novamente.");
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove?.();
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {preview ? (
        <div className={cn(
          "relative rounded-lg overflow-hidden border border-border bg-muted",
          aspectClasses[aspectRatio]
        )}>
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {!uploading && (
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1" />
                Trocar
              </Button>
              {onRemove && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleRemove}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/50 hover:bg-muted transition-colors flex flex-col items-center justify-center gap-2 p-6",
            aspectClasses[aspectRatio],
            uploading && "pointer-events-none opacity-50"
          )}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Clique para enviar uma imagem
              </span>
              <span className="text-xs text-muted-foreground">
                JPEG, PNG, WebP ou GIF (max {bucket === "avatars" ? "2MB" : "5MB"})
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
