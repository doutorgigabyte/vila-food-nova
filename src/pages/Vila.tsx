import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Store, Clock, Star, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useVila } from "@/hooks/useVilas";
import Footer from "@/components/landing/Footer";
import { VilaWayfindingSheet } from "@/components/wayfinding/VilaWayfindingSheet";

const Vila = () => {
  const { slug } = useParams<{ slug: string }>();
  const { vila, establishments, loading } = useVila(slug || "");
  const [wayfindingOpen, setWayfindingOpen] = useState(false);
  const [initialDestination, setInitialDestination] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-48 w-full rounded-xl mb-6" />
          <Skeleton className="h-6 w-64 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!vila) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Vila não encontrada</h1>
          <Link to="/marketplace" className="text-primary hover:underline">
            Voltar ao marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="relative">
        <div className="h-48 md:h-64 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
          {vila.image_url ? (
            <img
              src={vila.image_url}
              alt={vila.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="w-24 h-24 text-primary/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        <div className="absolute top-4 left-4">
          <Link
            to="/marketplace"
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="max-w-7xl mx-auto flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{vila.name}</h1>
              <div className="flex items-center gap-4 text-white/80">
                {vila.neighborhood && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {vila.neighborhood}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Store className="w-4 h-4" />
                  {establishments.length} estabelecimentos
                </span>
              </div>
            </div>
            {vila.has_wayfinding && (
              <Button
                type="button"
                onClick={() => {
                  setInitialDestination(null);
                  setWayfindingOpen(true);
                }}
                className="bg-white text-foreground hover:bg-white/90 shadow-lg"
                size="sm"
                aria-label={`Abrir mapa de como chegar na ${vila.name}`}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Como chegar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {vila.description && (
            <p className="text-muted-foreground mb-8 max-w-2xl">
              {vila.description}
            </p>
          )}

          <div className="flex items-center gap-2 mb-6">
            <Badge variant="outline" className="text-primary border-primary">
              Pedido único para retirada
            </Badge>
            <span className="text-sm text-muted-foreground">
              Faça pedidos em múltiplos estabelecimentos desta vila
            </span>
          </div>

          {establishments.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum estabelecimento cadastrado nesta vila ainda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {establishments.map((est) => {
                const hasCoords =
                  typeof est.latitude === "number" && typeof est.longitude === "number";
                return (
                  <Card
                    key={est.id}
                    className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30"
                  >
                    <Link to={`/loja/${est.slug}`} className="block">
                      <div className="relative h-32 bg-muted overflow-hidden">
                        {est.banner_url ? (
                          <img
                            src={est.banner_url}
                            alt={est.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                            <Store className="w-8 h-8 text-primary/30" />
                          </div>
                        )}
                        {est.logo_url && (
                          <div className="absolute -bottom-6 left-4">
                            <div className="w-16 h-16 rounded-xl border-4 border-background bg-background overflow-hidden shadow-lg">
                              <img
                                src={est.logo_url}
                                alt={est.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant={est.is_open ? "default" : "secondary"}
                            className={est.is_open ? "bg-green-500" : ""}
                          >
                            {est.is_open ? "Aberto" : "Fechado"}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4 pt-8">
                        <h3 className="font-bold text-foreground mb-1">{est.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            4.5
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {est.avg_delivery_time || 30} min
                          </span>
                        </div>
                        {est.accepts_pickup && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            Retirada disponível
                          </Badge>
                        )}
                      </CardContent>
                    </Link>
                    {vila.has_wayfinding && hasCoords && (
                      <div className="px-4 pb-4 -mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setInitialDestination(est.id);
                            setWayfindingOpen(true);
                          }}
                          aria-label={`Tracar trajeto ate ${est.name}`}
                        >
                          <Navigation className="w-3.5 h-3.5 mr-2" />
                          Tracar trajeto
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {vila.has_wayfinding && (
        <VilaWayfindingSheet
          vila={vila}
          establishments={establishments}
          open={wayfindingOpen}
          onOpenChange={setWayfindingOpen}
          initialDestinationId={initialDestination}
        />
      )}
    </div>
  );
};

export default Vila;
