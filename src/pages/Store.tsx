import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Store as StoreIcon, Package, ArrowLeft } from "lucide-react";
import { useStoreData, type StoreProduct } from "@/hooks/useStoreData";
import { ProductModal } from "@/components/store/ProductModal";
import { CartSheet, type CartItem } from "@/components/store/CartSheet";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreHero } from "@/components/store/StoreHero";
import { StoreBanners } from "@/components/store/StoreBanners";
import { StoreCategoryNav } from "@/components/store/StoreCategoryNav";
import { StoreProductGrid } from "@/components/store/StoreProductGrid";
import { StoreInfoTab } from "@/components/store/StoreInfoTab";
import { StoreFloatingCart } from "@/components/store/StoreFloatingCart";

const Store = () => {
  const { slug } = useParams();
  const {
    establishment,
    products,
    categories,
    promotionalProducts,
    featuredProducts,
    loading,
    error,
  } = useStoreData(slug);

  const [activeTab, setActiveTab] = useState("loja");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchTerm === "" ||
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

  // Group products by category for display
  const productGroups = useMemo(() => {
    if (selectedCategory || searchTerm) {
      return [{ title: selectedCategory === "promocoes" ? "🔥 Promoções" : selectedCategory === "destaques" ? "⭐ Destaques" : "Resultados", products: filteredProducts }];
    }

    const groups: { title: string; products: StoreProduct[] }[] = [];

    if (promotionalProducts.length > 0) {
      groups.push({ title: "🔥 Promoções", products: promotionalProducts });
    }

    if (featuredProducts.length > 0) {
      groups.push({ title: "⭐ Destaques", products: featuredProducts });
    }

    categories.forEach((cat) => {
      const catProducts = products.filter((p) => p.category_id === cat.id);
      if (catProducts.length > 0) {
        groups.push({ title: cat.name, products: catProducts });
      }
    });

    const uncategorized = products.filter((p) => !p.category_id);
    if (uncategorized.length > 0) {
      groups.push({ title: "Outros", products: uncategorized });
    }

    return groups;
  }, [products, categories, promotionalProducts, featuredProducts, filteredProducts, selectedCategory, searchTerm]);

  // Cart functions
  const addToCart = (product: StoreProduct, quantity: number = 1, observation: string = "") => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, observation: observation || item.observation }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity, observation }]);
    }
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const price = item.product.promotional_price || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  // Category nav data
  const categoryNavData = useMemo(() => {
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      count: products.filter((p) => p.category_id === cat.id).length,
    }));
  }, [categories, products]);

  // Handle tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "carrinho") {
      setIsCartOpen(true);
    }
    if (tab === "inicio") {
      window.location.href = "/marketplace";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-20 rounded-xl shrink-0" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-40 rounded-xl shrink-0" />
            ))}
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header Navigation */}
      <StoreHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartCount={cartItemsCount}
        primaryColor={establishment.primary_color || undefined}
      />

      {activeTab === "info" ? (
        <StoreInfoTab establishment={establishment} />
      ) : activeTab === "conta" ? (
        <div className="p-4 text-center">
          <div className="py-12">
            <StoreIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Minha Conta</h2>
            <p className="text-muted-foreground mb-4">Faça login para ver seus pedidos</p>
            <Button asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <StoreHero establishment={establishment} cashbackPercentage={5} />

          {/* Promotional Banners */}
          <StoreBanners banners={[]} primaryColor={establishment.primary_color || undefined} />

          {/* Search Bar */}
          <div className="mx-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar produto ou serviço..."
                className="pl-10 pr-10 h-12 rounded-xl border-2 focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-muted rounded-full flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Navigation */}
          <StoreCategoryNav
            categories={categoryNavData}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            hasPromotions={promotionalProducts.length > 0}
            hasFeatured={featuredProducts.length > 0}
            promoCount={promotionalProducts.length}
            featuredCount={featuredProducts.length}
          />

          {/* Products */}
          {products.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">Cardápio em construção</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Este estabelecimento ainda não cadastrou produtos
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground text-sm mt-1">Tente buscar por outro termo</p>
            </div>
          ) : (
            productGroups.map(
              (group, index) =>
                group.products.length > 0 && (
                  <StoreProductGrid
                    key={index}
                    title={group.title}
                    products={group.products}
                    onProductClick={(product) => setSelectedProduct(product)}
                    onQuickAdd={(product) => addToCart(product)}
                    viewMode={selectedCategory || searchTerm ? "grid" : "scroll"}
                  />
                )
            )
          )}
        </>
      )}

      {/* Floating Cart Button */}
      <StoreFloatingCart
        itemCount={cartItemsCount}
        total={cartTotal}
        onClick={() => setIsCartOpen(true)}
        primaryColor={establishment.primary_color || undefined}
      />

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(product, quantity, observation) => {
          addToCart(product, quantity, observation);
          setSelectedProduct(null);
        }}
      />

      {/* Cart Sheet */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => {
          setIsCartOpen(false);
          if (activeTab === "carrinho") setActiveTab("loja");
        }}
        items={cart}
        establishmentId={establishment.id}
        establishmentSlug={establishment.slug}
        deliveryFee={establishment.delivery_base_fee || 5}
        minOrder={establishment.min_order_value || 0}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        onAddProduct={(product) => addToCart(product)}
      />
    </div>
  );
};

export default Store;
