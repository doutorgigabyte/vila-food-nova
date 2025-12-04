import { Link } from "react-router-dom";
import { Star, Clock, MapPin, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Establishment } from "@/hooks/useEstablishment";

interface AllRestaurantsProps {
  establishments: Establishment[];
  loading?: boolean;
}

const AllRestaurants = ({ establishments, loading }: AllRestaurantsProps) => {
  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6">Todos os Restaurantes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-40 bg-muted" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2 w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (establishments.length === 0) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6">Todos os Restaurantes</h2>
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🍽️</span>
            </div>
            <h3 className="font-semibold mb-2">Nenhum restaurante encontrado</h3>
            <p className="text-muted-foreground">
              Não há restaurantes disponíveis no momento
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Todos os Restaurantes</h2>
          <span className="text-sm text-muted-foreground">
            {establishments.length} estabelecimentos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {establishments.map((est) => (
            <Link key={est.id} to={`/loja/${est.slug}`}>
              <Card className="overflow-hidden hover:shadow-elevated transition-all group h-full">
                <div className="relative h-40">
                  {est.banner_url ? (
                    <img
                      src={est.banner_url}
                      alt={est.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-6xl opacity-50">🍴</span>
                    </div>
                  )}
                  
                  {!est.is_open && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <Badge variant="secondary" className="text-sm">Fechado</Badge>
                    </div>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 w-8 h-8 bg-card/80 backdrop-blur-sm hover:bg-card text-muted-foreground hover:text-destructive"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>

                  {est.is_open && (
                    <Badge className="absolute top-2 left-2 bg-green-500">Aberto</Badge>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {est.logo_url ? (
                      <img
                        src={est.logo_url}
                        alt={est.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-background -mt-8 relative z-10 shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-background -mt-8 relative z-10 flex items-center justify-center shadow-md">
                        <span className="text-lg">🏪</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{est.name}</h3>
                      {est.neighborhood && (
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {est.neighborhood}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">4.5</span>
                      <span className="text-muted-foreground">(0)</span>
                    </div>
                    {est.avg_delivery_time && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{est.avg_delivery_time} min</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    {est.min_order_value && est.min_order_value > 0 && (
                      <>
                        <span>Pedido mín: R$ {est.min_order_value.toFixed(2)}</span>
                      </>
                    )}
                    <div className="flex gap-1 ml-auto">
                      {est.accepts_delivery && (
                        <Badge variant="outline" className="text-xs py-0">Delivery</Badge>
                      )}
                      {est.accepts_pickup && (
                        <Badge variant="outline" className="text-xs py-0">Retirada</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AllRestaurants;
