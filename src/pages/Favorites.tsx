import { Link } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileBottomNav from "@/components/marketplace/MobileBottomNav";

const Favorites = () => {
  // TODO: Implementar sistema de favoritos com Supabase
  const favorites: any[] = [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Link to="/marketplace">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Favoritos</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Nenhum favorito ainda</h2>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Adicione estabelecimentos aos seus favoritos para encontrá-los rapidamente aqui.
            </p>
            <Link to="/marketplace">
              <Button>Explorar estabelecimentos</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {/* Lista de favoritos será renderizada aqui */}
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Favorites;
