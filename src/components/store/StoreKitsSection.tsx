import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { ProductKitCard } from './ProductKitCard';
import type { ProductKit } from '@/hooks/useProductKits';
import { useCart, EstablishmentInfo } from '@/hooks/useCart';
import { toast } from 'sonner';

interface StoreKitsSectionProps {
  kits: ProductKit[];
  establishmentSlug: string;
  establishmentInfo: EstablishmentInfo;
}

export const StoreKitsSection = ({ kits, establishmentSlug, establishmentInfo }: StoreKitsSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleAddToCart = async (kit: ProductKit) => {
    // Add kit as a single product-like item
    const kitProduct = {
      id: `kit-${kit.id}`,
      name: `Kit: ${kit.name}`,
      price: kit.kit_price,
      promotional_price: null,
      image_url: kit.image_url,
      establishment_id: kit.establishment_id,
    };

    const success = await addToCart(kitProduct, establishmentInfo, 1, `Kit com ${kit.items.length} itens`);
    
    if (success) {
      toast.success(`Kit "${kit.name}" adicionado ao carrinho!`);
    }
  };

  if (kits.length === 0) return null;

  return (
    <div className="my-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Combos & Kits</h2>
        </div>
        {kits.length > 1 && (
          <div className="hidden md:flex gap-1">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Kits */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {kits.map((kit) => (
          <ProductKitCard
            key={kit.id}
            kit={kit}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
};
