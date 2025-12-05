import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StoreFloatingCartProps {
  itemCount: number;
  total: number;
  onClick: () => void;
  primaryColor?: string;
}

export const StoreFloatingCart = ({ itemCount, total, onClick, primaryColor }: StoreFloatingCartProps) => {
  if (itemCount === 0) return null;

  const bgStyle = primaryColor
    ? { background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }
    : {};

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background to-transparent">
      <Button
        className={cn(
          "w-full h-14 rounded-xl shadow-xl text-white font-semibold",
          "flex items-center justify-between px-4",
          "hover:scale-[1.02] transition-transform"
        )}
        style={primaryColor ? bgStyle : undefined}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-primary text-xs font-bold rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <span>Fechar pedido</span>
        </div>
        <span className="text-lg font-bold">R$ {total.toFixed(2)}</span>
      </Button>
    </div>
  );
};
