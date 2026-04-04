import { ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  establishment_id: string;
  establishments?: {
    slug: string;
    name: string;
  };
}

interface CategoryProductsSectionProps {
  products: Product[];
  categoryName: string;
  loading: boolean;
}

const CategoryProductsSection = ({ products, categoryName, loading }: CategoryProductsSectionProps) => {
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const calculateDiscount = (price: number, promoPrice: number) => {
    return Math.round(((price - promoPrice) / price) * 100);
  };

  if (loading) {
    return (
      <div className="py-6 px-4">
        <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-6 bg-muted/30">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-lg font-semibold">Produtos em Destaque</h2>
        <Button variant="link" className="text-primary">Ver todos</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-4">
        {products.slice(0, 10).map((product) => (
          <button
            key={product.id}
            onClick={() => navigate(`/produto/${product.id}`)}
            className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-200 text-left group"
          >
            {/* Image */}
            <div className="relative aspect-square bg-muted">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              
              {/* Discount badge */}
              {product.promotional_price && product.promotional_price < product.price && (
                <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                  -{calculateDiscount(product.price, product.promotional_price)}%
                </Badge>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              
              {product.establishments?.name && (
                <p className="text-xs text-muted-foreground mb-2 truncate">
                  {product.establishments.name}
                </p>
              )}

              <div className="flex items-center gap-2">
                {product.promotional_price && product.promotional_price < product.price ? (
                  <>
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {formatPrice(product.promotional_price)}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-foreground">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryProductsSection;
