import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadToS3, deleteFromS3, validateFile, UploadType } from "@/lib/s3";
import { ImageCropModal } from "./ImageCropModal";

interface ImageUploadProps {
  bucket: UploadType;
  currentImage?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  aspectRatio?: "square" | "banner" | "auto" | "video";
  establishmentId?: string;
  enableCrop?: boolean;
}

export const ImageUpload = ({
  bucket,
  currentImage,
  onUpload,
  onRemove,
  className,
  aspectRatio = "square",
  establishmentId,
  enableCrop = true,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
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

  // Aspect ratio numbers for cropper
  const aspectRatioNumbers = {
    square: 1,
    banner: 3 / 1,
    video: 16 / 9,
    auto: 16 / 9,
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

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);

    if (enableCrop) {
      // Open crop modal
      setSelectedImageSrc(objectUrl);
      setOriginalFile(file);
      setCropModalOpen(true);
    } else {
      // Direct upload without cropping
      await uploadFile(file, objectUrl);
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File | Blob, previewUrl: string) => {
    setUploading(true);
    setPreview(previewUrl);

    try {
      // Delete old image from S3 if exists and is a CloudFront/S3 URL
      if (currentImage && (currentImage.includes('cloudfront.net') || currentImage.includes('s3.amazonaws.com'))) {
        try {
          await deleteFromS3(currentImage, establishmentId);
          console.log('Old image deleted from S3');
        } catch (deleteError) {
          console.warn('Failed to delete old image, continuing with upload:', deleteError);
        }
      }

      // Convert Blob to File if needed
      const fileToUpload = file instanceof File 
        ? file 
        : new File([file], originalFile?.name || 'cropped-image.jpg', { type: 'image/jpeg' });

      // Upload to S3
      const result = await uploadToS3(fileToUpload, bucket, establishmentId);

      onUpload(result.url);
      toast.success("Imagem enviada com sucesso!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Upload error:", errorMessage);
      toast.error("Erro ao enviar imagem. Tente novamente.");
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropModalOpen(false);
    
    // Create preview from cropped blob
    const croppedUrl = URL.createObjectURL(croppedBlob);
    
    // Upload the cropped image
    await uploadFile(croppedBlob, croppedUrl);
    
    // Cleanup
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
    }
    setSelectedImageSrc(null);
    setOriginalFile(null);
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
    }
    setSelectedImageSrc(null);
    setOriginalFile(null);
  };

  const handleRemove = async () => {
    // Delete from S3 if it's a CloudFront/S3 URL
    if (currentImage && (currentImage.includes('cloudfront.net') || currentImage.includes('s3.amazonaws.com'))) {
      setDeleting(true);
      try {
        await deleteFromS3(currentImage, establishmentId);
        toast.success("Imagem removida");
      } catch (error) {
        console.warn('Failed to delete from S3:', error);
      } finally {
        setDeleting(false);
      }
    }

    setPreview(null);
    onRemove?.();
  };

  return (
    <>
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

      {/* Crop Modal */}
      {selectedImageSrc && (
        <ImageCropModal
          open={cropModalOpen}
          onClose={handleCropCancel}
          imageSrc={selectedImageSrc}
          aspectRatio={aspectRatioNumbers[aspectRatio]}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};
