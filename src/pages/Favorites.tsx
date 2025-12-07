import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Store, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import MobileBottomNav from '@/components/marketplace/MobileBottomNav';

const Favorites = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('establishments');
  const { user } = useAuth();
  const { 
    favoriteEstablishments, 
    favoriteProducts, 
    loading,
    toggleFavoriteEstablishment,
    toggleFavoriteProduct
  } = useFavorites();

  const getImageUrl = (url: string | null) => {
    if (!url) return '/placeholder.svg';
    if (url.startsWith('http')) return url;
    return `https://d2fhl3f70zfvod.cloudfront.net/${url}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-background border-b p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Favoritos</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Heart className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Faça login para ver seus favoritos</h2>
          <p className="text-muted-foreground mb-6">
            Salve seus estabelecimentos e produtos favoritos para acessar rapidamente.
          </p>
          <Button onClick={() => navigate('/auth')}>
            Entrar ou Cadastrar
          </Button>
        </div>

        <MobileBottomNav />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isEmpty = favoriteEstablishments.length === 0 && favoriteProducts.length === 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background border-b p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Favoritos</h1>
        </div>
      </header>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center p-8 text-center mt-12">
          <Heart className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum favorito ainda</h2>
          <p className="text-muted-foreground mb-6">
            Explore o marketplace e adicione seus estabelecimentos e produtos favoritos.
          </p>
          <Button onClick={() => navigate('/')}>
            Explorar Marketplace
          </Button>
        </div>
      ) : (
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="establishments" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Lojas ({favoriteEstablishments.length})
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos ({favoriteProducts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="establishments" className="space-y-4">
              {favoriteEstablishments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum estabelecimento favoritado
                </div>
              ) : (
                favoriteEstablishments.map((establishment) => (
                  <Card 
                    key={establishment.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/loja/${establishment.slug}`)}
                  >
                    <div className="flex">
                      <img
                        src={getImageUrl(establishment.logo_url)}
                        alt={establishment.name}
                        className="w-24 h-24 object-cover"
                      />
                      <CardContent className="flex-1 p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{establishment.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {establishment.description || 'Sem descrição'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteEstablishment(establishment.id);
                            }}
                          >
                            <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={establishment.is_open ? 'default' : 'secondary'}>
                            {establishment.is_open ? 'Aberto' : 'Fechado'}
                          </Badge>
                          {establishment.avg_delivery_time && (
                            <span className="text-xs text-muted-foreground">
                              {establishment.avg_delivery_time} min
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              {favoriteProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto favoritado
                </div>
              ) : (
                favoriteProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/produto/${product.id}`)}
                  >
                    <div className="flex">
                      <img
                        src={getImageUrl(product.image_url)}
                        alt={product.name}
                        className="w-24 h-24 object-cover"
                      />
                      <CardContent className="flex-1 p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {product.establishments?.name}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteProduct(product.id);
                            }}
                          >
                            <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {product.promotional_price ? (
                            <>
                              <span className="text-sm line-through text-muted-foreground">
                                R$ {product.price.toFixed(2)}
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                R$ {product.promotional_price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold">
                              R$ {product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
};

export default Favorites;
