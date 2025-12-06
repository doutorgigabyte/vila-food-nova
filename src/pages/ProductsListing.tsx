import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Percent, Sparkles, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductsByMainCategory } from "@/hooks/useProducts";
import ProductOfferCard from "@/components/marketplace/ProductOfferCard";
import MobileBottomNav from "@/components/marketplace/MobileBottomNav";
import { getCategoryTheme } from "@/lib/categoryThemes";

type SectionType = 'ofertas' | 'destaques' | 'trending' | 'recomendados' | 'todos';

const sectionConfig: Record<SectionType, { 
  title: string; 
  subtitle: string; 
  icon: React.ReactNode;
  filter?: (products: any[]) => any[];
}> = {
  ofertas: {
    title: "Ofertas Especiais",
    subtitle: "Os melhores preços para você",
    icon: <Percent className="w-5 h-5" />,
    filter: (products) => products.filter(p => p.promotional_price && p.promotional_price < p.price)
  },
  destaques: {
    title: "Em Destaque",
    subtitle: "Produtos selecionados especialmente",
    icon: <Star className="w-5 h-5" />,
    filter: (products) => products.filter(p => p.is_featured)
  },
  trending: {
    title: "Em Alta",
    subtitle: "Os mais pedidos do momento",
    icon: <TrendingUp className="w-5 h-5" />,
    filter: (products) => products
  },
  recomendados: {
    title: "Recomendados",
    subtitle: "Só pra você",
    icon: <Sparkles className="w-5 h-5" />,
    filter: (products) => products
  },
  todos: {
    title: "Todos os Produtos",
    subtitle: "Explore nosso catálogo completo",
    icon: <Package className="w-5 h-5" />,
    filter: (products) => products
  }
};

const ProductsListing = () => {
  const navigate = useNavigate();
  const { section } = useParams<{ section: string }>();
  const [searchParams] = useSearchParams();
  const mainCategory = searchParams.get('categoria');
  
  const sectionType = (section as SectionType) || 'todos';
  const config = sectionConfig[sectionType] || sectionConfig.todos;
  const theme = getCategoryTheme(mainCategory);
  
  const { products, loading } = useProductsByMainCategory(mainCategory, 100);
  
  const filteredProducts = config.filter ? config.filter(products) : products;

  // Get dynamic title based on category
  const getDynamicTitle = () => {
    if (sectionType === 'ofertas') return theme.offersTitle;
    if (sectionType === 'destaques') return theme.trendingTitle;
    if (sectionType === 'trending') return theme.trendingTitle;
    if (sectionType === 'recomendados') return theme.forYouTitle;
    return config.title;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-lg ${theme.accentColor ? 'bg-primary/10' : 'bg-muted'}`}>
              {config.icon}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{getDynamicTitle()}</h1>
              <p className="text-xs text-muted-foreground">{config.subtitle}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Nenhum produto encontrado
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Não encontramos produtos nesta categoria no momento. Tente explorar outras categorias.
            </p>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => navigate('/')}
            >
              Voltar ao início
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <ProductOfferCard 
                key={product.id} 
                product={product} 
                variant="large" 
              />
            ))}
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default ProductsListing;
