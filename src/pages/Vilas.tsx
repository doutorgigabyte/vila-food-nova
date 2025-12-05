import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Store, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useVilas } from "@/hooks/useVilas";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/landing/Footer";

interface VilaWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  neighborhood: string | null;
  address: string | null;
  establishmentCount: number;
}

const Vilas = () => {
  const { vilas, loading } = useVilas();
  const [vilasWithCount, setVilasWithCount] = useState<VilaWithCount[]>([]);
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      if (vilas.length === 0) {
        setLoadingCounts(false);
        return;
      }

      const vilasData: VilaWithCount[] = await Promise.all(
        vilas.map(async (vila) => {
          const { count } = await supabase
            .from('establishments')
            .select('*', { count: 'exact', head: true })
            .eq('vila_id', vila.id)
            .eq('status', 'active');

          return {
            ...vila,
            establishmentCount: count || 0,
          };
        })
      );

      setVilasWithCount(vilasData);
      setLoadingCounts(false);
    };

    fetchCounts();
  }, [vilas]);

  const isLoading = loading || loadingCounts;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              to="/marketplace"
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold">Vilas Gastronômicas</h1>
              <p className="text-sm text-muted-foreground">Explore os melhores polos de alimentação</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Info Banner */}
        <Card className="mb-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg mb-1">Pedido único para múltiplos estabelecimentos</h2>
                <p className="text-muted-foreground">
                  Nas vilas gastronômicas, você pode fazer pedidos em vários estabelecimentos ao mesmo tempo 
                  e retirar tudo em um único local. Ideal para grupos e famílias!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vilas Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : vilasWithCount.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma vila disponível</h2>
            <p className="text-muted-foreground mb-6">
              Em breve teremos novas vilas gastronômicas para você explorar.
            </p>
            <Link to="/marketplace" className="text-primary hover:underline">
              Voltar ao marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vilasWithCount.map((vila) => (
              <Link key={vila.id} to={`/vila/${vila.slug}`}>
                <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30 h-full">
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
                    {vila.image_url ? (
                      <img
                        src={vila.image_url}
                        alt={vila.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20">
                        <MapPin className="w-16 h-16 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-bold text-white text-xl mb-1">{vila.name}</h3>
                      {vila.neighborhood && (
                        <span className="text-white/80 text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {vila.neighborhood}
                        </span>
                      )}
                    </div>
                    {vila.establishmentCount > 0 && (
                      <Badge className="absolute top-3 right-3 bg-primary">
                        {vila.establishmentCount} estabelecimento{vila.establishmentCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Store className="w-4 h-4" />
                        <span className="text-sm">
                          {vila.establishmentCount > 0 
                            ? `${vila.establishmentCount} estabelecimento${vila.establishmentCount > 1 ? 's' : ''}`
                            : 'Em breve'
                          }
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    {vila.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {vila.description}
                      </p>
                    )}
                    {vila.establishmentCount === 0 && (
                      <Badge variant="secondary" className="mt-2">
                        Cadastro de estabelecimentos em andamento
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Vilas;