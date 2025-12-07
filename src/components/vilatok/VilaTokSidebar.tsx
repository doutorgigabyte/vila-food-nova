import { Heart, Share2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getImageUrl } from '@/lib/s3';

interface VilaTokSidebarProps {
  videoId: string;
  likesCount: number;
  sharesCount: number;
  commentsCount?: number;
  isLiked: boolean;
  onLike: () => void;
  onShare: () => void;
  onComment: () => void;
  onViewProduct: () => void;
  onGoToStore: () => void;
  hasProduct: boolean;
  // Thumbnails dos vídeos do estabelecimento para navegação visual
  videoThumbnails?: Array<{
    id: string;
    thumbnail_url: string | null;
    isActive: boolean;
  }>;
}

export function VilaTokSidebar({
  likesCount,
  sharesCount,
  commentsCount = 0,
  isLiked,
  onLike,
  onShare,
  onComment,
  videoThumbnails = [],
}: VilaTokSidebarProps) {
  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Video Thumbnails Navigation - Círculos como no layout */}
      {videoThumbnails.length > 1 && (
        <div className="flex flex-col items-center gap-2 mb-2">
          {videoThumbnails.slice(0, 6).map((thumb) => (
            <div
              key={thumb.id}
              className={cn(
                "w-11 h-11 rounded-full overflow-hidden border-2 transition-all duration-200",
                thumb.isActive 
                  ? "border-primary ring-2 ring-primary/50 scale-110" 
                  : "border-white/40 opacity-60"
              )}
            >
              {thumb.thumbnail_url ? (
                <img 
                  src={getImageUrl(thumb.thumbnail_url)} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted/50" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Like Button - Círculo vermelho quando ativo */}
      <button
        onClick={onLike}
        className="flex flex-col items-center gap-0.5 transition-transform active:scale-90"
      >
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
          isLiked 
            ? "bg-primary" 
            : "bg-black/30 backdrop-blur-sm"
        )}>
          <Heart 
            className={cn(
              "w-6 h-6 transition-all",
              isLiked 
                ? "fill-white text-white" 
                : "text-white"
            )} 
          />
        </div>
        <span className="text-white text-[10px] font-medium drop-shadow-lg">
          {formatCount(likesCount)}
        </span>
      </button>

      {/* Comment Button */}
      <button
        onClick={onComment}
        className="flex flex-col items-center gap-0.5 transition-transform active:scale-90"
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <span className="text-white text-[10px] font-medium drop-shadow-lg">
          {formatCount(commentsCount)}
        </span>
      </button>

      {/* Share Button */}
      <button
        onClick={onShare}
        className="flex flex-col items-center gap-0.5 transition-transform active:scale-90"
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <Share2 className="w-6 h-6 text-white" />
        </div>
        <span className="text-white text-[10px] font-medium drop-shadow-lg">
          {formatCount(sharesCount)}
        </span>
      </button>
    </div>
  );
}
