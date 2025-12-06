import { Link, useLocation } from "react-router-dom";
import { Home, Heart, ShoppingBag, ClipboardList, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

const MobileBottomNav = () => {
  const location = useLocation();
  const { items } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { icon: Home, label: "Início", path: "/marketplace" },
    { icon: Heart, label: "Favoritos", path: "/favoritos" },
    { icon: ShoppingBag, label: "Carrinho", path: "/checkout", isCenter: true, count: cartCount },
    { icon: ClipboardList, label: "Pedidos", path: "/pedidos" },
    { icon: Menu, label: "Menu", path: "/menu" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-inset-bottom md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative -mt-6"
              >
                <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 text-primary-foreground transition-transform active:scale-95">
                  <Icon className="w-6 h-6" />
                  {item.count && item.count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
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
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors touch-feedback",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
