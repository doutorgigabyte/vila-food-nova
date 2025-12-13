import { useNavigate } from 'react-router-dom';
import { Package, Plus, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ProductKit } from '@/hooks/useProductKits';

interface ProductKitCardProps {
  kit: ProductKit;
  onAddToCart: (kit: ProductKit) => void;
}

export const ProductKitCard = ({ kit, onAddToCart }: ProductKitCardProps) => {
  const navigate = useNavigate();
  const savings = kit.original_price - kit.kit_price;
  const savingsPercent = Math.round((savings / kit.original_price) * 100);

  const handleCardClick = () => {
    navigate(`/kit/${kit.id}`);
  };

  return (
    <div 
      className="bg-card rounded-xl border shadow-sm overflow-hidden min-w-[280px] max-w-[320px] flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative h-40 bg-muted">
        {kit.image_url ? (
          <img
            src={kit.image_url}
            alt={kit.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Savings badge */}
        {savingsPercent > 0 && (
          <Badge 
            className="absolute top-2 left-2 bg-green-500 text-white gap-1"
          >
            <Tag className="w-3 h-3" />
            {savingsPercent}% OFF
          </Badge>
        )}

        <Badge 
          className="absolute top-2 right-2 bg-primary text-primary-foreground"
        >
          KIT
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 line-clamp-1">{kit.name}</h3>
        
        {kit.description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {kit.description}
          </p>
        )}

        {/* Items list */}
        <div className="text-xs text-muted-foreground mb-3 space-y-1">
          {kit.items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-1">
              <span className="w-4 h-4 bg-muted rounded-full flex items-center justify-center text-[10px] font-medium">
                {item.quantity}x
              </span>
              <span className="line-clamp-1">{item.product?.name || 'Produto'}</span>
            </div>
          ))}
          {kit.items.length > 3 && (
            <span className="text-primary text-xs">
              +{kit.items.length - 3} itens
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            {savings > 0 && (
              <p className="text-sm text-muted-foreground line-through">
                R$ {kit.original_price.toFixed(2)}
              </p>
            )}
            <p className="text-xl font-bold text-primary">
              R$ {kit.kit_price.toFixed(2)}
            </p>
            {savings > 0 && (
              <p className="text-xs text-green-600 font-medium">
                Economize R$ {savings.toFixed(2)}
              </p>
            )}
          </div>

          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(kit);
            }}
            className="rounded-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
};
