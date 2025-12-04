import { useRef } from "react";
import { Link } from "react-router-dom";
import { Star, Heart, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  restaurantName: string;
  originalPrice: number;
  currentPrice: number;
  discount?: string;
  image: string;
  rating?: number;
  isVeg?: boolean;
  isNonVeg?: boolean;
}

const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Cheesecake",
    restaurantName: "Mini Kebab",
    originalPrice: 200,
    currentPrice: 140,
    discount: "30%",
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400",
    isNonVeg: false
  },
  {
    id: "2",
    name: "Cappuccino Coffee",
    restaurantName: "Hungry Puppets",
    originalPrice: 50,
    currentPrice: 40,
    discount: "R$10",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
    isVeg: true
  },
  {
    id: "3",
    name: "Cheese Burger",
    restaurantName: "Hungry Puppets",
    originalPrice: 150,
    currentPrice: 120,
    discount: "20%",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    isNonVeg: true
  },
  {
    id: "4",
    name: "Spicy Crab Early Fo...",
    restaurantName: "Hungry Puppets",
    originalPrice: 400,
    currentPrice: 290,
    discount: "R$110",
    image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400",
    isNonVeg: true
  },
  {
    id: "5",
    name: "Pizza Margherita",
    restaurantName: "Pizza House",
    originalPrice: 60,
    currentPrice: 45,
    discount: "25%",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
    isVeg: true
  },
];

interface TrendingProductsProps {
  products?: Product[];
  title?: string;
  subtitle?: string;
}

const TrendingProducts = ({ 
  products = defaultProducts,
  title = "Tendências do Dia",
  subtitle = "Aqui está o que você pode gostar de provar"
}: TrendingProductsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-8 bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-primary">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

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
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => (
              <Card key={product.id} className="flex-shrink-0 w-48 overflow-hidden group/card hover:shadow-lg transition-all">
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                  />
                  
                  {product.discount && (
                    <Badge className="absolute top-2 left-2 bg-destructive text-xs">
                      {product.discount} OFF
                    </Badge>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 w-7 h-7 bg-card/80 backdrop-blur-sm hover:bg-card text-muted-foreground hover:text-destructive"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    size="icon" 
                    className="absolute bottom-2 right-2 w-7 h-7 rounded-full shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{product.restaurantName}</p>
                  <h3 className="font-medium text-sm truncate flex items-center gap-1">
                    {product.name}
                    {product.isVeg && <span className="text-green-500">🟢</span>}
                    {product.isNonVeg && <span className="text-red-500">🔴</span>}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground line-through">
                      R$ {product.originalPrice.toFixed(2)}
                    </span>
                    <span className="font-bold text-sm">
                      R$ {product.currentPrice.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
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

export default TrendingProducts;
