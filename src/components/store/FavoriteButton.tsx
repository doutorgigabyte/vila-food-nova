import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FavoriteButtonProps {
  id: string;
  type: 'product' | 'establishment';
  name?: string;
  className?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "icon";
}

export const FavoriteButton = ({ 
  id, 
  type, 
  name,
  className,
  variant = "ghost",
  size = "icon"
}: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id, type);
    if (!isFav) {
      toast.success(name ? `${name} adicionado aos favoritos` : "Adicionado aos favoritos");
    } else {
      toast.info("Removido dos favoritos");
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleClick}
      className={cn(
        "transition-all",
        isFav && "text-red-500 hover:text-red-600",
        className
      )}
      title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
    </Button>
  );
};
