import { Link } from "react-router-dom";
import { Star, Heart, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Highlight {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  rating: number;
  reviews: number;
  discount?: string;
  restaurantLogo?: string;
  restaurantName: string;
  type: "promo" | "video" | "banner";
}

const defaultHighlights: Highlight[] = [
  {
    id: "1",
    title: "Prove o Sabor! Festival de Comida...",
    subtitle: "Delicie-se com as delícias culinárias em nosso Festival de Comida Extravagante!",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
    rating: 4.7,
    reviews: 3,
    discount: "45%",
    restaurantLogo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100",
    restaurantName: "Food Festival",
    type: "promo"
  },
  {
    id: "2",
    title: "Hambúrgueres Incríveis! Desconto de 4...",
    subtitle: "Descubra ofertas imbatíveis com nossa promoção de 45%!",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
    rating: 4.7,
    reviews: 3,
    restaurantLogo: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=100",
    restaurantName: "Burger House",
    type: "banner"
  },
  {
    id: "3",
    title: "Promoção de Verão!",
    subtitle: "Mergulhe nas economias com nossa Promoção de Verão!",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
    rating: 4.5,
    reviews: 2,
    discount: "30%",
    restaurantLogo: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=100",
    restaurantName: "Summer Foods",
    type: "promo"
  },
];

interface HighlightsSectionProps {
  highlights?: Highlight[];
}

const HighlightsSection = ({ highlights = defaultHighlights }: HighlightsSectionProps) => {
  return (
    <section className="py-8 bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Destaques para você</h2>
            <p className="text-sm text-muted-foreground">Veja nossos restaurantes e pratos mais populares</p>
          </div>
          <div className="text-primary text-2xl">✨</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((highlight) => (
            <Card key={highlight.id} className="overflow-hidden group hover:shadow-elevated transition-all">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={highlight.image}
                  alt={highlight.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {highlight.discount && (
                  <Badge className="absolute top-3 left-3 bg-destructive">
                    {highlight.discount} OFF
                  </Badge>
                )}
                
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{highlight.rating}</span>
                  <span className="text-muted-foreground">({highlight.reviews})</span>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {highlight.restaurantLogo && (
                    <img
                      src={highlight.restaurantLogo}
                      alt={highlight.restaurantName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-background"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{highlight.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{highlight.subtitle}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                    <Heart className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HighlightsSection;
