import { Link, useLocation } from "react-router-dom";
import { Home, Heart, ShoppingBag, ClipboardList, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { motion } from "framer-motion";

const MobileBottomNav = () => {
  const location = useLocation();
  const { items } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Haptic feedback for touch devices
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const navItems = [
    { icon: Home, label: "Início", path: "/marketplace" },
    { icon: Heart, label: "Favoritos", path: "/favoritos" },
    { icon: ShoppingBag, label: "Carrinho", path: "/checkout", isCenter: true, count: cartCount },
    { icon: ClipboardList, label: "Pedidos", path: "/pedidos" },
    { icon: Menu, label: "Menu", path: "/menu" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-inset-bottom md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={triggerHaptic}
                className="relative -mt-6"
              >
                <motion.div 
                  className="relative flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 text-primary-foreground touch-target"
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Icon className="w-6 h-6" />
                  {item.count && item.count > 0 && (
                    <motion.span 
                      className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      key={item.count}
                    >
                      {item.count > 9 ? "9+" : item.count}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={triggerHaptic}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors touch-feedback touch-target",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              </motion.div>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <motion.div 
                  className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                  layoutId="activeIndicator"
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
