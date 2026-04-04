import { useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Price } from "@/components/ui/price";

interface StoreFloatingCartProps {
  itemCount: number;
  total: number;
  onClick: () => void;
  primaryColor?: string;
}

export const StoreFloatingCart = ({ itemCount, total, onClick, primaryColor }: StoreFloatingCartProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Listen for cart-item-added event
  useEffect(() => {
    const handleCartItemAdded = () => {
      setIsAnimating(true);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
      // Reset animation after it completes
      setTimeout(() => setIsAnimating(false), 600);
    };

    window.addEventListener('cart-item-added', handleCartItemAdded);
    return () => window.removeEventListener('cart-item-added', handleCartItemAdded);
  }, []);

  if (itemCount === 0) return null;

  const bgStyle = primaryColor
    ? { background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }
    : {};

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background to-transparent safe-area-inset-bottom">
      <Button
        className={cn(
          "w-full h-14 rounded-xl shadow-xl text-white font-semibold",
          "flex items-center justify-between px-4",
          "hover:scale-[1.02] active:scale-[0.98] transition-transform touch-manipulation",
          isAnimating && "animate-cart-pop"
        )}
        style={primaryColor ? bgStyle : undefined}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className={cn("w-5 h-5", isAnimating && "animate-cart-bounce")} />
            <span 
              className={cn(
                "absolute -top-2 -right-2 w-5 h-5 bg-white text-primary text-xs font-bold rounded-full flex items-center justify-center",
                isAnimating && "animate-badge-ping"
              )}
            >
              {itemCount}
            </span>
          </div>
          <span>Fechar pedido</span>
        </div>
        <Price value={total} size="lg" className="text-white" />
      </Button>
    </div>
  );
};