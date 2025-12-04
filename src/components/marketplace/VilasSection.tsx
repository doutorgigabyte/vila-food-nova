import { Link } from "react-router-dom";
import { MapPin, Store, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useVilas, Vila } from "@/hooks/useVilas";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VilaWithCount extends Vila {
  establishmentCount: number;
}

const VilasSection = () => {
  const { vilas, loading } = useVilas();
  const [vilasWithCount, setVilasWithCount] = useState<VilaWithCount[]>([]);

  useEffect(() => {
    const fetchCounts = async () => {
      if (vilas.length === 0) return;

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

      setVilasWithCount(vilasData.filter(v => v.establishmentCount > 0));
    };

    fetchCounts();
  }, [vilas]);

  if (loading) {
    return (
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (vilasWithCount.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Vilas Gastronômicas</h2>
              <p className="text-sm text-muted-foreground">Explore os melhores polos de alimentação</p>
            </div>
          </div>
          <Link 
            to="/vilas" 
            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
          >
            Ver todas <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vilasWithCount.map((vila) => (
            <Link key={vila.id} to={`/vila/${vila.slug}`}>
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
                  {vila.image_url ? (
                    <img
                      src={vila.image_url}
                      alt={vila.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-bold text-white text-lg">{vila.name}</h3>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Store className="w-4 h-4" />
                      <span className="text-sm">{vila.establishmentCount} estabelecimentos</span>
                    </div>
                    {vila.neighborhood && (
                      <Badge variant="secondary" className="text-xs">
                        {vila.neighborhood}
                      </Badge>
                    )}
                  </div>
                  {vila.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {vila.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VilasSection;
