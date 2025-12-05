import { Link } from "react-router-dom";
import { Star, Heart, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEstablishments } from "@/hooks/useEstablishment";

const HighlightsSection = () => {
  const { establishments, loading } = useEstablishments();
  
  // Pegar apenas os primeiros 3 estabelecimentos como destaques
  const highlights = establishments.slice(0, 3);

  if (loading) {
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
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-48 bg-muted" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (highlights.length === 0) {
    return null;
  }

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
          {highlights.map((est) => (
            <Link key={est.id} to={`/loja/${est.slug}`}>
              <Card className="overflow-hidden group hover:shadow-elevated transition-all h-full">
                <div className="relative h-48 overflow-hidden">
                  {est.banner_url ? (
                    <img
                      src={est.banner_url}
                      alt={est.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.classList.add('bg-gradient-to-br', 'from-primary/20', 'to-primary/5');
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-6xl opacity-50">🍽️</span>
                    </div>
                  )}
                  
                  {est.is_open ? (
                    <Badge className="absolute top-3 left-3 bg-green-500">Aberto</Badge>
                  ) : (
                    <Badge variant="secondary" className="absolute top-3 left-3">Fechado</Badge>
                  )}
                  
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>4.5</span>
                    <span className="text-muted-foreground">(0)</span>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {est.logo_url ? (
                      <img
                        src={est.logo_url}
                        alt={est.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-background"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg">🏪</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{est.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{est.description}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                    {est.neighborhood && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {est.neighborhood}
                      </span>
                    )}
                    {est.avg_delivery_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {est.avg_delivery_time} min
                      </span>
                    )}
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

export default HighlightsSection;
