import { Link } from "react-router-dom";
import { Star, Clock, MapPin, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  rating: number;
  deliveryTime: string;
  logo?: string;
  isOpen: boolean;
}

const defaultRestaurants: Restaurant[] = [
  {
    id: "1",
    name: "Hungry Puppets",
    slug: "hungry-puppets",
    address: "Rua 00, Bairro 00, Centro...",
    rating: 4.7,
    deliveryTime: "100+ km",
    logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100",
    isOpen: true
  },
  {
    id: "2",
    name: "Café Monarch",
    slug: "cafe-monarch",
    address: "Ghatkopar - Mankhurd...",
    rating: 5.0,
    deliveryTime: "100+ km",
    logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=100",
    isOpen: true
  },
  {
    id: "3",
    name: "Vintage Kitchen",
    slug: "vintage-kitchen",
    address: "Rua 00, Bairro 00, Centro...",
    rating: 5.0,
    deliveryTime: "100+ km",
    logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100",
    isOpen: true
  },
];

interface RestaurantsSectionProps {
  restaurants?: Restaurant[];
  title?: string;
}

const RestaurantsSection = ({ 
  restaurants = defaultRestaurants, 
  title = "Quer Comer no Local?" 
}: RestaurantsSectionProps) => {
  return (
    <section className="py-8 bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
              <span className="text-4xl">🍽️</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {restaurants.map((restaurant) => (
            <Link 
              key={restaurant.id}
              to={`/loja/${restaurant.slug}`}
              className="flex-shrink-0 flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors min-w-[280px]"
            >
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-background"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{restaurant.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{restaurant.address}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{restaurant.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">📍 {restaurant.deliveryTime}</span>
                </div>
              </div>
            </Link>
          ))}
          
          <Button variant="ghost" className="flex-shrink-0 gap-1 text-primary">
            Ver Todos
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RestaurantsSection;
