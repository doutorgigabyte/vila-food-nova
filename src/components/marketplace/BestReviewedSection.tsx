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
  originalPrice?: number;
  currentPrice: number;
  discount?: string;
  image: string;
  rating: number;
  reviews: number;
  isVeg?: boolean;
  isNonVeg?: boolean;
}

const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Meat Pizza",
    restaurantName: "Hungry Puppets",
    originalPrice: 400,
    currentPrice: 370,
    discount: "R$30",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
    rating: 4.7,
    reviews: 3,
    isNonVeg: true
  },
  {
    id: "2",
    name: "Veg Momos",
    restaurantName: "Vintage Kitchen",
    currentPrice: 320,
    image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400",
    rating: 5.0,
    reviews: 1,
    isVeg: true
  },
  {
    id: "3",
    name: "Toll House Pie",
    restaurantName: "Redcliff Cafe",
    originalPrice: 14,
    currentPrice: 13.58,
    discount: "3%",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400",
    rating: 5.0,
    reviews: 1,
    isVeg: true
  },
  {
    id: "4",
    name: "Hazelnut Semifreddo",
    restaurantName: "Redcliff Cafe",
    originalPrice: 14,
    currentPrice: 13.58,
    discount: "3%",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400",
    rating: 4.0,
    reviews: 1,
    isNonVeg: false
  },
  {
    id: "5",
    name: "Mutton Biriyani",
    restaurantName: "Café Monarch",
    originalPrice: 250,
    currentPrice: 225,
    discount: "10%",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400",
    rating: 5.0,
    reviews: 1,
    isNonVeg: true
  },
];

interface BestReviewedSectionProps {
  products?: Product[];
}

const BestReviewedSection = ({ products = defaultProducts }: BestReviewedSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-8 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Melhores Avaliados</h2>
          <Button variant="ghost" size="sm" className="text-primary gap-1">
            Ver todos
            <ChevronRight className="w-4 h-4" />
          </Button>
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
              <Card key={product.id} className="flex-shrink-0 w-52 overflow-hidden group/card hover:shadow-lg transition-all">
                <div className="relative h-40 overflow-hidden">
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
                  
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{product.rating}</span>
                    <span className="text-xs text-muted-foreground">({product.reviews})</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    {product.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        R$ {product.originalPrice.toFixed(2)}
                      </span>
                    )}
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

export default BestReviewedSection;
