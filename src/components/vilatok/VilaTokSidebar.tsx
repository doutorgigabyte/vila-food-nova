import { Heart, Share2, ShoppingCart, Store, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VilaTokSidebarProps {
  videoId: string;
  likesCount: number;
  sharesCount: number;
  isLiked: boolean;
  onLike: () => void;
  onShare: () => void;
  onViewProduct: () => void;
  onGoToStore: () => void;
  hasProduct: boolean;
}

export function VilaTokSidebar({
  likesCount,
  sharesCount,
  isLiked,
  onLike,
  onShare,
  onViewProduct,
  onGoToStore,
  hasProduct,
}: VilaTokSidebarProps) {
  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Like Button */}
      <button
        onClick={onLike}
        className="flex flex-col items-center gap-1 transition-transform active:scale-90"
      >
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          "bg-black/30 backdrop-blur-sm",
          isLiked && "text-red-500"
        )}>
          <Heart 
            className={cn(
              "w-7 h-7 transition-all",
              isLiked && "fill-red-500 text-red-500 scale-110"
            )} 
          />
        </div>
        <span className="text-white text-xs font-medium drop-shadow-lg">
          {formatCount(likesCount)}
        </span>
      </button>

      {/* Comment Button (placeholder for future) */}
      <button
        className="flex flex-col items-center gap-1 transition-transform active:scale-90 opacity-50"
        disabled
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
        <span className="text-white text-xs font-medium drop-shadow-lg">Em breve</span>
      </button>

      {/* Share Button */}
      <button
        onClick={onShare}
        className="flex flex-col items-center gap-1 transition-transform active:scale-90"
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <Share2 className="w-7 h-7 text-white" />
        </div>
        <span className="text-white text-xs font-medium drop-shadow-lg">
          {formatCount(sharesCount)}
        </span>
      </button>

      {/* View Product Button */}
      {hasProduct && (
        <button
          onClick={onViewProduct}
          className="flex flex-col items-center gap-1 transition-transform active:scale-90"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/80 backdrop-blur-sm">
            <ShoppingCart className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-medium drop-shadow-lg">Comprar</span>
        </button>
      )}

      {/* Go to Store Button */}
      <button
        onClick={onGoToStore}
        className="flex flex-col items-center gap-1 transition-transform active:scale-90"
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <Store className="w-7 h-7 text-white" />
        </div>
        <span className="text-white text-xs font-medium drop-shadow-lg">Loja</span>
      </button>
    </div>
  );
}
