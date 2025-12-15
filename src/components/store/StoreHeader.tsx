import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, Store, ShoppingCart, Info, User, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getContrastColor } from "@/lib/colorUtils";

interface StoreHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartCount: number;
  primaryColor?: string;
}

const tabs = [
  { id: "inicio", label: "INÍCIO", icon: Home },
  { id: "loja", label: "LOJA", icon: Store },
  { id: "carrinho", label: "CARRINHO", icon: ShoppingCart },
  { id: "info", label: "INFO", icon: Info },
  { id: "conta", label: "CONTA", icon: User },
];

export const StoreHeader = ({ activeTab, onTabChange, cartCount, primaryColor }: StoreHeaderProps) => {
  const bgStyle = primaryColor 
    ? { background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }
    : {};
  
  const textColor = primaryColor ? getContrastColor(primaryColor) : undefined;

  return (
    <header 
      className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg"
      style={{ ...bgStyle, color: textColor }}
    >
      <nav className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all",
                "hover:bg-white/10",
                isActive && "bg-white/20"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.id === "carrinho" && cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-destructive text-[10px] rounded-full flex items-center justify-center font-bold">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
