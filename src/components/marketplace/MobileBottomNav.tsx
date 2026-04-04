import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Heart, ShoppingBag, ClipboardList, User, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

const MobileBottomNav = () => {
  const location = useLocation();
  const { items } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
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

  // Haptic feedback for touch devices
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const navItems = [
    { icon: Home, label: "Início", path: "/" },
    { icon: Flame, label: "VilaTok", path: "/vilatok" },
    { icon: ShoppingBag, label: "Carrinho", path: "/checkout", isCenter: true, count: cartCount },
    { icon: Heart, label: "Favoritos", path: "/favoritos" },
    { icon: User, label: "Conta", path: "/menu" },
  ];

  // Check if current path matches or starts with the nav item path
  const isPathActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "/marketplace";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-inset-bottom md:hidden"
      aria-label="Navegação principal"
      role="navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = isPathActive(item.path);
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={triggerHaptic}
                className="relative -mt-6"
                aria-label={`${item.label}${item.count && item.count > 0 ? ` com ${item.count} ${item.count === 1 ? 'item' : 'itens'}` : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div 
                  className={cn(
                    "relative flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 text-primary-foreground touch-target transition-transform duration-200",
                    isAnimating && "animate-cart-pop"
                  )}
                  role="button"
                  tabIndex={-1}
                >
                  <Icon className={cn("w-6 h-6", isAnimating && "animate-cart-bounce")} aria-hidden="true" />
                  {item.count && item.count > 0 && (
                    <span 
                      className={cn(
                        "absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center",
                        isAnimating ? "animate-badge-ping" : "animate-in zoom-in duration-300"
                      )}
                      key={`${item.count}-${isAnimating}`}
                      aria-label={`${item.count} ${item.count === 1 ? 'item no carrinho' : 'itens no carrinho'}`}
                    >
                      {item.count > 9 ? "9+" : item.count}
                    </span>
                  )}
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={triggerHaptic}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors touch-feedback touch-target relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="active:scale-85 transition-transform duration-200">
                <Icon className={cn("w-5 h-5", isActive && "text-primary")} aria-hidden="true" />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div 
                  className="absolute bottom-1 w-1 h-1 rounded-full bg-primary animate-in fade-in duration-300"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;