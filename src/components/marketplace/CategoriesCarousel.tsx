import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  image?: string;
  color: string;
}

const defaultCategories: Category[] = [
  { id: "1", name: "Americana", color: "bg-blue-100", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=200" },
  { id: "2", name: "Brasileira", color: "bg-green-100", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=200" },
  { id: "3", name: "Italiana", color: "bg-red-100", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200" },
  { id: "4", name: "Japonesa", color: "bg-orange-100", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200" },
  { id: "5", name: "Fast Food", color: "bg-yellow-100", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200" },
  { id: "6", name: "Chinesa", color: "bg-pink-100", image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=200" },
  { id: "7", name: "Indiana", color: "bg-amber-100", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200" },
  { id: "8", name: "Mexicana", color: "bg-purple-100", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200" },
];

interface CategoriesCarouselProps {
  categories?: Category[];
  onCategoryClick?: (categoryId: string) => void;
}

const CategoriesCarousel = ({ categories = defaultCategories, onCategoryClick }: CategoriesCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-8 bg-card">
      <div className="container mx-auto px-4">
        <h2 className="text-xl font-bold mb-6">O que você está buscando?</h2>
        
        <div className="relative group">
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryClick?.(category.id)}
                className="flex-shrink-0 flex flex-col items-center gap-2 group/item"
              >
                <div 
                  className={`w-24 h-24 rounded-2xl ${category.color} flex items-center justify-center overflow-hidden transition-transform group-hover/item:scale-105 shadow-soft`}
                >
                  {category.image ? (
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">🍽️</span>
                  )}
                </div>
                <span className="text-sm font-medium text-center">{category.name}</span>
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity bg-card"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CategoriesCarousel;
