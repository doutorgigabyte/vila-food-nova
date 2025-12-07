import { Heart, Share2, ShoppingBag, Store, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VilaTokSidebarProps {
  likesCount: number;
  sharesCount: number;
  commentsCount: number;
  isLiked: boolean;
  hasProduct: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onProduct: () => void;
  onStore: () => void;
}

export function VilaTokSidebar({
  likesCount,
  sharesCount,
  commentsCount,
  isLiked,
  hasProduct,
  onLike,
  onComment,
  onShare,
  onProduct,
  onStore,
}: VilaTokSidebarProps) {
  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const SidebarButton = ({ 
    icon: Icon, 
    count, 
    onClick, 
    active, 
    activeColor,
    label,
    isPrimary
  }: { 
    icon: typeof Heart; 
    count?: number; 
    onClick: () => void; 
    active?: boolean;
    activeColor?: string;
    label?: string;
    isPrimary?: boolean;
  }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex flex-col items-center gap-1 group"
      aria-label={label}
    >
      <div className={cn(
        "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200",
        "backdrop-blur-sm border border-white/20",
        "group-hover:scale-110 group-active:scale-95",
        isPrimary ? "bg-primary/80" : "bg-black/30",
        active && activeColor
      )}>
        <Icon 
          className={cn(
            "w-5 h-5 transition-colors",
            active ? "text-primary fill-primary" : "text-white"
          )} 
        />
      </div>
      {count !== undefined && (
        <span className="text-white text-xs font-medium drop-shadow-lg">
          {formatCount(count)}
        </span>
      )}
      {label && count === undefined && (
        <span className="text-white text-[10px] font-medium drop-shadow-lg">
          {label}
        </span>
      )}
    </button>
  );

  return (
    <div className="absolute right-3 bottom-48 flex flex-col items-center gap-4 z-30">
      {/* Like Button */}
      <SidebarButton
        icon={Heart}
        count={likesCount}
        onClick={onLike}
        active={isLiked}
        activeColor="bg-red-500/30 border-red-500/50"
      />

      {/* Comment Button */}
      <SidebarButton
        icon={MessageCircle}
        count={commentsCount}
        onClick={onComment}
      />

      {/* Share Button */}
      <SidebarButton
        icon={Share2}
        count={sharesCount}
        onClick={onShare}
      />

      {/* Product Button - Only show if has product */}
      {hasProduct && (
        <SidebarButton
          icon={ShoppingBag}
          onClick={onProduct}
          label="Comprar"
          isPrimary
        />
      )}

      {/* Store Button */}
      <SidebarButton
        icon={Store}
        onClick={onStore}
        label="Loja"
      />
    </div>
  );
}
