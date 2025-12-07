import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "square" | "video" | "card" | "banner";
  fallback?: string;
}

const aspectRatioClasses = {
  square: "aspect-square",
  video: "aspect-video",
  card: "aspect-[4/3]",
  banner: "aspect-[16/9]",
};

export const OptimizedImage = ({
  src,
  alt,
  className,
  aspectRatio = "square",
  fallback = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Reset states when src changes
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div className={cn("relative overflow-hidden bg-muted", aspectRatioClasses[aspectRatio], className)}>
      {/* Skeleton loader */}
      {!isLoaded && (
        <div className="absolute inset-0 skeleton-shimmer" />
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={hasError ? fallback : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};

export default OptimizedImage;
