import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDragScroll } from "@/hooks/useDragScroll";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Subcategory {
  id: string;
  name: string;
  icon?: string;
}

interface SubcategoryCarouselProps {
  subcategories: Subcategory[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  categoryColor?: string;
  categoryIcon?: string;
}

// Emojis para subcategorias - mapeamento completo
const subcategoryEmojis: Record<string, string> = {
  // Mercado
  "todos": "🏠",
  "supermercados": "🛒",
  "bebidas": "🥤",
  "hortifruti": "🥬",
  "padaria": "🥖",
  "açougue": "🥩",
  "frios": "🧀",
  "limpeza": "🧹",
  "higiene": "🧴",
  "congelados": "🧊",
  "laticínios": "🥛",
  "mercearia": "🛒",
  // Comida
  "doces e bolos": "🍰",
  "árabe": "🥙",
  "salgados": "🥟",
  "açaí": "🍇",
  "chinesa": "🥡",
  "brasileira": "🍛",
  "pizza": "🍕",
  "padarias": "🥐",
  "pastel": "🥟",
  "italiana": "🍝",
  "lanches": "🍔",
  "carnes": "🥩",
  "saudável": "🥗",
  "sorvetes": "🍦",
  "japonesa": "🍣",
  "marmita": "🍱",
  "hamburguer": "🍔",
  "pizzaria": "🍕",
  "restaurante": "🍽️",
  // Moda
  "moda masculina": "👔",
  "moda feminina": "👗",
  "moda infantil": "👶",
  "calçados": "👟",
  "acessórios": "💍",
  "bolsas": "👜",
  "joias": "💎",
  "óculos": "🕶️",
  "relógios": "⌚",
  // Beleza
  "cosméticos": "💄",
  "perfumaria": "🌸",
  "cuidados pessoais": "🧴",
  "maquiagem": "💅",
  // Casa
  "decoração": "🏠",
  "móveis": "🛋️",
  "eletrodomésticos": "🔌",
  "utilidades": "🧹",
  // Pet
  "pet shop": "🐕",
  "ração": "🦴",
  "acessórios pet": "🐾",
  // Tech
  "eletrônicos": "📱",
  "informática": "💻",
  "games": "🎮",
  // Farmácia
  "medicamentos": "💊",
  "vitaminas": "💪",
  "suplementos": "🏋️",
  "dermocosméticos": "✨",
  // Outros
  "esportes": "⚽",
  "brinquedos": "🧸",
  "papelaria": "📚",
  "jardim": "🌱",
  "automotivo": "🚗",
  "artesanato": "🎨",
  "serviços": "🔧",
};

const getEmoji = (name: string): string => {
  const normalized = name.toLowerCase().trim();
  return subcategoryEmojis[normalized] || "📦";
};

const subcategoryColors = [
  "from-rose-500/20 to-rose-500/5 border-rose-500/30",
  "from-amber-500/20 to-amber-500/5 border-amber-500/30",
  "from-lime-500/20 to-lime-500/5 border-lime-500/30",
  "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
  "from-violet-500/20 to-violet-500/5 border-violet-500/30",
  "from-pink-500/20 to-pink-500/5 border-pink-500/30",
  "from-orange-500/20 to-orange-500/5 border-orange-500/30",
  "from-teal-500/20 to-teal-500/5 border-teal-500/30",
  "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30",
  "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
];

const SubcategoryCarousel = ({
  subcategories,
  selectedId,
  onSelect,
  categoryColor,
  categoryIcon,
}: SubcategoryCarouselProps) => {
  const { scrollRef, isDragging, handlers, scroll, wasClick } = useDragScroll();

  if (subcategories.length === 0) return null;

  return (
    <div className="relative group py-2">
      {/* Desktop Navigation Arrows */}
      <Button
        variant="outline"
        size="icon"
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 shadow-lg opacity-0 group-hover:opacity-100 transition-all bg-background/95 backdrop-blur-sm hidden md:flex h-8 w-8 border-border/50"
        onClick={() => scroll("left")}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div
        ref={scrollRef}
        {...handlers}
        className={cn(
          "flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1",
          "touch-pan-y will-change-scroll overscroll-x-contain",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: isDragging ? 'none' : 'x proximity',
        }}
      >
        {/* Card "Todos" */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => wasClick() && onSelect(null)}
          style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
          className={cn(
            "flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all",
            "border-2 min-w-[90px] justify-center",
            !selectedId
              ? "bg-gradient-to-br from-primary/20 to-primary/5 border-primary text-primary shadow-md"
              : "bg-gradient-to-br from-muted/50 to-muted/20 border-border/50 hover:border-border text-foreground/80"
          )}
        >
          <span className="text-lg">{categoryIcon || "🏠"}</span>
          <span className="font-medium text-sm whitespace-nowrap">Todos</span>
        </motion.button>

        {/* Subcategory Cards */}
        {subcategories.map((subcategory, index) => {
          const isSelected = selectedId === subcategory.id;
          const colorClass = subcategoryColors[index % subcategoryColors.length];
          // Sempre usar emoji do nome, ignorar o campo icon que contém nomes de ícones Lucide
          const emoji = getEmoji(subcategory.name);

          return (
            <motion.button
              key={subcategory.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => wasClick() && onSelect(isSelected ? null : subcategory.id)}
              style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all",
                "border-2 min-w-[100px] justify-center",
                isSelected
                  ? "bg-gradient-to-br from-primary/20 to-primary/5 border-primary text-primary shadow-md"
                  : `bg-gradient-to-br ${colorClass} hover:shadow-sm`
              )}
            >
              <span className="text-lg">{emoji}</span>
              <span className={cn(
                "font-medium text-sm whitespace-nowrap",
                isSelected ? "text-primary" : "text-foreground/80"
              )}>
                {subcategory.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 shadow-lg opacity-0 group-hover:opacity-100 transition-all bg-background/95 backdrop-blur-sm hidden md:flex h-8 w-8 border-border/50"
        onClick={() => scroll("right")}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default SubcategoryCarousel;
