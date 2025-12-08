import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
// import { motion } from "framer-motion"; // Temporarily disabled - needs npm install
import { cn } from "@/lib/utils";

// Mapeamento de emojis para categorias
const categoryEmojis: Record<string, string> = {
  mercado: "🛒",
  farmacia: "💊",
  compras: "🛍️",
  comida: "🍔",
  artesanato: "🎨",
  servicos: "🔧",
};

// Verificar se é um emoji válido (não um nome de ícone Lucide)
const isValidEmoji = (icon: string | undefined): boolean => {
  if (!icon) return false;
  // Nomes de ícones Lucide contêm traços ou são palavras em inglês
  if (icon.includes('-') || /^[a-z]+$/i.test(icon)) return false;
  return true;
};

const getEmojiFromLabel = (label: string): string => {
  const normalized = label.toLowerCase().trim();
  return categoryEmojis[normalized] || "📦";
};

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
  isActive?: boolean;
}

interface CategoryBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const CategoryBreadcrumb = ({ items, className }: CategoryBreadcrumbProps) => {
  return (
    <nav className={cn("flex items-center gap-1 text-sm overflow-x-auto scrollbar-hide", className)}>
      {items.map((item, index) => {
        // Use emoji válido ou buscar pelo nome
        const displayIcon = isValidEmoji(item.icon) 
          ? item.icon 
          : (index > 0 ? getEmojiFromLabel(item.label) : null);

        return (
          <div
            key={index}
            className="flex items-center gap-1 flex-shrink-0 animate-in fade-in slide-in-from-left-2 duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {index > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            )}
            
            {item.href && !item.isActive ? (
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all",
                  "hover:bg-muted/80 active:scale-95",
                  index === 0 ? "text-muted-foreground" : "text-foreground/80"
                )}
              >
                {index === 0 ? (
                  <Home className="w-3.5 h-3.5" />
                ) : displayIcon ? (
                  <span className="text-sm">{displayIcon}</span>
                ) : null}
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            ) : (
              <span
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full",
                  item.isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-foreground"
                )}
              >
                {displayIcon && <span className="text-sm">{displayIcon}</span>}
                <span className="whitespace-nowrap">{item.label}</span>
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default CategoryBreadcrumb;
