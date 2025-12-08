import { Heart, Share2, ShoppingBag, Store, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

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

const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

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
  const handleButtonClick = useCallback((e: React.MouseEvent | React.TouchEvent, onClick: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    onClick();
  }, []);

  const Button = ({ icon: Icon, count, onClick, active, label, primary }: {
    icon: typeof Heart;
    count?: number;
    onClick: () => void;
    active?: boolean;
    label?: string;
    primary?: boolean;
  }) => {
    const handleClick = useCallback((e: React.MouseEvent) => {
      handleButtonClick(e, onClick);
    }, [onClick, handleButtonClick]);

    const handleTouch = useCallback((e: React.TouchEvent) => {
      handleButtonClick(e, onClick);
    }, [onClick, handleButtonClick]);

    return (
      <button
        type="button"
        onClick={handleClick}
        onTouchEnd={handleTouch}
        className="flex flex-col items-center gap-1 relative z-[60] cursor-pointer"
        style={{ touchAction: 'manipulation' }}
      >
        <div className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95",
          primary ? "bg-primary/80" : "bg-black/30",
          active && "bg-red-500/30"
        )}>
          <Icon className={cn("w-5 h-5", active ? "text-primary fill-primary" : "text-white")} />
        </div>
        {count !== undefined && <span className="text-white text-xs">{formatCount(count)}</span>}
        {label && <span className="text-white text-[10px]">{label}</span>}
      </button>
    );
  };

  return (
    <div className="absolute right-3 bottom-48 flex flex-col items-center gap-4 z-[60]" data-vilatok-sidebar>
      <Button icon={Heart} count={likesCount} onClick={onLike} active={isLiked} />
      <Button icon={MessageCircle} count={commentsCount} onClick={onComment} />
      <Button icon={Share2} count={sharesCount} onClick={onShare} />
      {hasProduct && <Button icon={ShoppingBag} onClick={onProduct} label="Comprar" primary />}
      <Button icon={Store} onClick={onStore} label="Loja" />
    </div>
  );
}