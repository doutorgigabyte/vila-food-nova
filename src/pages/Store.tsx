import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  MapPin, 
  Phone, 
  Search, 
  ShoppingBag, 
  Info,
  Bike,
  CreditCard,
  Banknote,
  QrCode,
  Store as StoreIcon,
  Flame,
  Tag,
  Package
} from "lucide-react";
import { useStoreData, type StoreProduct } from "@/hooks/useStoreData";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductModal } from "@/components/store/ProductModal";
import { CartSheet, type CartItem } from "@/components/store/CartSheet";

const Store = () => {
  const { slug } = useParams();
  const { 
    establishment, 
    products, 
    categories, 
    promotionalProducts,
    featuredProducts,
    productsByCategory,
    loading, 
    error 
  } = useStoreData(slug);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = searchTerm === "" || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (selectedCategory === "promocoes") {
        return matchesSearch && product.promotional_price && product.promotional_price < product.price;
      }
      if (selectedCategory === "destaques") {
        return matchesSearch && product.is_featured;
      }
      
      const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Group filtered products by category
  const groupedProducts = useMemo(() => {
    if (selectedCategory) {
      // If a category is selected, show all filtered products without grouping
      return [{ category: null, products: filteredProducts }];
    }

    // Group by category
    const groups: { category: typeof categories[0] | null; products: StoreProduct[] }[] = [];
    
    // Add promotions if any
    if (promotionalProducts.length > 0) {
      groups.push({
        category: { id: "promocoes", name: "🔥 Promoções", description: null, image_url: null, sort_order: -2 },
        products: filteredProducts.filter(p => p.promotional_price && p.promotional_price < p.price)
      });
    }

    // Add featured if any
    if (featuredProducts.length > 0 && filteredProducts.some(p => p.is_featured)) {
      groups.push({
        category: { id: "destaques", name: "⭐ Destaques", description: null, image_url: null, sort_order: -1 },
        products: filteredProducts.filter(p => p.is_featured)
      });
    }

    // Add products by category
    categories.forEach(cat => {
      const catProducts = filteredProducts.filter(p => p.category_id === cat.id);
      if (catProducts.length > 0) {
        groups.push({ category: cat, products: catProducts });
      }
    });

    // Add uncategorized products
    const uncategorized = filteredProducts.filter(p => !p.category_id);
    if (uncategorized.length > 0) {
      groups.push({
        category: { id: "outros", name: "Outros", description: null, image_url: null, sort_order: 999 },
        products: uncategorized
      });
    }

    return groups.filter(g => g.products.length > 0);
  }, [filteredProducts, categories, promotionalProducts, featuredProducts, selectedCategory]);

  // Cart functions
  const addToCart = (product: StoreProduct, quantity: number, observation: string) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + quantity, observation: observation || item.observation }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity, observation }]);
    }
  };

  const addProductFromRecommendation = (product: any) => {
    // Find full product data if available
    const fullProduct = products.find(p => p.id === product.id);
    if (fullProduct) {
      addToCart(fullProduct, 1, "");
    } else {
      // Use the basic product data from recommendation
      addToCart({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.promotional_price || product.price,
        promotional_price: product.promotional_price,
        image_url: product.image_url,
        is_featured: false,
        category_id: null,
        additionals: null,
        variations: null,
        preparation_time: null
      }, 1, "");
    }
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const price = item.product.promotional_price || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  // Build category tabs
  const categoryTabs = useMemo(() => {
    const tabs: { id: string; name: string; count: number }[] = [];
    
    if (promotionalProducts.length > 0) {
      tabs.push({ id: "promocoes", name: "Promoções", count: promotionalProducts.length });
    }
    if (featuredProducts.length > 0) {
      tabs.push({ id: "destaques", name: "Destaques", count: featuredProducts.length });
    }
    
    categories.forEach(cat => {
      const count = products.filter(p => p.category_id === cat.id).length;
      if (count > 0) {
        tabs.push({ id: cat.id, name: cat.name, count });
      }
    });

    return tabs;
  }, [categories, products, promotionalProducts, featuredProducts]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-48 md:h-64 w-full" />
        <div className="container mx-auto px-4 -mt-16 relative z-10">
          <div className="bg-card rounded-xl shadow-lg p-4 mb-6">
            <div className="flex items-start gap-4">
              <Skeleton className="w-20 h-20 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
          <Skeleton className="h-10 w-full mb-6" />
          <div className="flex gap-2 mb-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-24 rounded-full" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !establishment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <StoreIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Loja não encontrada</h1>
          <p className="text-muted-foreground mb-4">{error || "Esta loja não existe ou está indisponível."}</p>
          <Button asChild>
            <Link to="/marketplace">Voltar ao Marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Banner */}
      <div className="relative h-48 md:h-64">
        {establishment.banner_url ? (
          <img
            src={establishment.banner_url}
            alt={establishment.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Back button */}
        <Link 
          to="/marketplace" 
          className="absolute top-4 left-4 p-2 bg-background/90 rounded-full hover:bg-background transition-colors backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Info button */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="absolute top-4 right-4 p-2 bg-background/90 rounded-full hover:bg-background transition-colors backdrop-blur-sm">
              <Info className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Informações</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {establishment.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Endereço</p>
                    <p className="text-sm text-muted-foreground">
                      {establishment.address}
                      {establishment.neighborhood && `, ${establishment.neighborhood}`}
                    </p>
                  </div>
                </div>
              )}
              {establishment.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Telefone</p>
                    <p className="text-sm text-muted-foreground">{establishment.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Bike className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Entrega</p>
                  <p className="text-sm text-muted-foreground">
                    {establishment.avg_delivery_time || 45} min • Taxa: R$ {(establishment.delivery_base_fee || 5).toFixed(2)}
                  </p>
                  {establishment.min_order_value && (
                    <p className="text-sm text-muted-foreground">
                      Pedido mínimo: R$ {establishment.min_order_value.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <p className="font-medium mb-2">Opções de pedido</p>
                <div className="flex flex-wrap gap-2">
                  {establishment.accepts_delivery && (
                    <Badge variant="outline" className="gap-1">
                      <Bike className="w-3 h-3" /> Delivery
                    </Badge>
                  )}
                  {establishment.accepts_pickup && (
                    <Badge variant="outline" className="gap-1">
                      <Package className="w-3 h-3" /> Retirada
                    </Badge>
                  )}
                  {establishment.accepts_table && (
                    <Badge variant="outline" className="gap-1">
                      <StoreIcon className="w-3 h-3" /> Mesa
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="font-medium mb-2">Formas de pagamento</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <QrCode className="w-3 h-3" /> PIX
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <CreditCard className="w-3 h-3" /> Cartão
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Banknote className="w-3 h-3" /> Dinheiro
                  </Badge>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Store Info */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-card rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden border-4 border-background bg-muted shrink-0">
              {establishment.logo_url ? (
                <img
                  src={establishment.logo_url}
                  alt={establishment.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <StoreIcon className="w-8 h-8 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold truncate">{establishment.name}</h1>
                {establishment.is_open ? (
                  <Badge className="bg-green-500 hover:bg-green-500">Aberto</Badge>
                ) : (
                  <Badge variant="secondary">Fechado</Badge>
                )}
              </div>
              {establishment.segment && (
                <p className="text-sm text-muted-foreground mt-1">{establishment.segment.name}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">4.8</span>
                  <span className="text-muted-foreground">(324)</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{establishment.avg_delivery_time || 45} min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar no cardápio..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Categories */}
        {categoryTabs.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm font-medium ${
                !selectedCategory
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              Todos
            </button>
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm font-medium flex items-center gap-1.5 ${
                  selectedCategory === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {tab.id === "promocoes" && <Flame className="w-3.5 h-3.5" />}
                {tab.id === "destaques" && <Star className="w-3.5 h-3.5" />}
                {tab.name}
                <span className="opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Products */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Cardápio em construção</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Este estabelecimento ainda não cadastrou produtos
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Tente buscar por outro termo
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedProducts.map((group, idx) => (
              <div key={group.category?.id || idx}>
                {group.category && !selectedCategory && (
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    {group.category.id === "promocoes" && <Tag className="w-5 h-5 text-red-500" />}
                    {group.category.id === "destaques" && <Star className="w-5 h-5 text-amber-500" />}
                    {group.category.name}
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      {/* Cart Sheet */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        establishmentId={establishment.id}
        establishmentSlug={establishment.slug}
        deliveryFee={establishment.delivery_base_fee || 5}
        minOrder={establishment.min_order_value || 0}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        onAddProduct={addProductFromRecommendation}
      />

      {/* Floating Cart Button */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <Button 
            className="w-full h-14 text-base font-semibold shadow-lg"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Ver Carrinho
            <Badge variant="secondary" className="ml-2">
              {cartItemsCount}
            </Badge>
            <span className="ml-auto">R$ {cartTotal.toFixed(2)}</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default Store;
