import { Link, useLocation } from "react-router-dom";
import { Home, Heart, ShoppingBag, ClipboardList, Menu, Info, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoreBottomNavProps {
  cartCount: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
  primaryColor?: string;
}

const StoreBottomNav = ({ cartCount, activeTab, onTabChange, primaryColor }: StoreBottomNavProps) => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Início", tab: "inicio" },
    { icon: Menu, label: "Cardápio", tab: "loja" },
    { icon: ShoppingBag, label: "Carrinho", tab: "carrinho", isCenter: true, count: cartCount },
    { icon: Info, label: "Info", tab: "info" },
    { icon: User, label: "Conta", tab: "conta" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-inset-bottom md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.tab;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key={item.tab}
                onClick={() => onTabChange(item.tab)}
                className="relative -mt-6"
              >
                <div 
                  className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-primary-foreground transition-transform active:scale-95"
                  style={{ backgroundColor: primaryColor || 'hsl(var(--primary))' }}
                >
                  <Icon className="w-6 h-6" />
                  {item.count && item.count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {item.count > 9 ? "9+" : item.count}
                    </span>
                  )}
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.tab}
              onClick={() => onTabChange(item.tab)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors touch-feedback",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              style={isActive && primaryColor ? { color: primaryColor } : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default StoreBottomNav;
