import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadToS3, deleteFromS3, validateFile, UploadType } from "@/lib/s3";

interface ImageUploadProps {
  bucket: UploadType;
  currentImage?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  aspectRatio?: "square" | "banner" | "auto" | "video";
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
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync preview with currentImage when it changes
  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const aspectClasses = {
    square: "aspect-square",
    banner: "aspect-[3/1]",
    video: "aspect-video",
    auto: "",
  };

  const isCompact = aspectRatio === "square";

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

      // Delete old image from S3 if exists and is a CloudFront/S3 URL
      if (currentImage && (currentImage.includes('cloudfront.net') || currentImage.includes('s3.amazonaws.com'))) {
        try {
          await deleteFromS3(currentImage, establishmentId);
          console.log('Old image deleted from S3');
        } catch (deleteError) {
          console.warn('Failed to delete old image, continuing with upload:', deleteError);
        }
      }

      // Upload to S3
      const result = await uploadToS3(file, bucket, establishmentId);

      onUpload(result.url);
      toast.success("Imagem enviada para S3 com sucesso!");
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

  const handleRemove = async () => {
    // Delete from S3 if it's a CloudFront/S3 URL
    if (currentImage && (currentImage.includes('cloudfront.net') || currentImage.includes('s3.amazonaws.com'))) {
      setDeleting(true);
      try {
        await deleteFromS3(currentImage, establishmentId);
        toast.success("Imagem removida do S3");
      } catch (error) {
        console.warn('Failed to delete from S3:', error);
        // Continue with removal even if S3 delete fails
      } finally {
        setDeleting(false);
      }
    }

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
        <div
          className={cn(
            "relative rounded-lg overflow-hidden border border-border bg-muted",
            aspectClasses[aspectRatio]
          )}
        >
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          {!uploading && !deleting && (
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
          {(uploading || deleting) && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center flex-col gap-2">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <span className="text-white text-sm">{deleting ? 'Removendo...' : 'Enviando...'}</span>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/50 hover:bg-muted transition-colors flex flex-col items-center justify-center gap-2",
            isCompact ? "p-3" : "p-4 sm:p-6",
            aspectClasses[aspectRatio],
            uploading && "pointer-events-none opacity-50"
          )}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          ) : (
            <>
              <ImageIcon className={cn("text-muted-foreground", isCompact ? "w-6 h-6" : "w-8 h-8")} />
              <span className={cn("text-muted-foreground text-center", isCompact ? "text-xs" : "text-sm")}>
                Clique para enviar
              </span>
              <span
                className={cn(
                  "text-xs text-muted-foreground text-center",
                  isCompact && "hidden sm:block"
                )}
              >
                JPEG, PNG, WebP ou GIF (max {bucket === "avatars" ? "2MB" : "5MB"})
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
