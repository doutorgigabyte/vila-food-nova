import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Package, Tag, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useDragScroll } from "@/hooks/useDragScroll";
import { toast } from "sonner";
import { useCart, type EstablishmentInfo } from "@/hooks/useCart";

interface KitItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

interface ProductKit {
  id: string;
  name: string;
  description: string | null;
  kit_price: number;
  original_price: number;
  image_url: string | null;
  establishment_id: string;
  establishment: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    is_open: boolean | null;
    vila_id: string | null;
    delivery_base_fee: number | null;
    min_order_value: number | null;
    accepts_pickup: boolean | null;
    accepts_delivery: boolean | null;
  };
  items: KitItem[];
}

interface MarketplaceKitsSectionProps {
  mainCategory?: string | null;
}

const MarketplaceKitsSection = ({ mainCategory }: MarketplaceKitsSectionProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [kits, setKits] = useState<ProductKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { scrollRef, isDragging, handlers, scroll, scrollStyles } = useDragScroll({
    momentum: true,
    friction: 0.92,
  });

  useEffect(() => {
    fetchKits();
  }, [mainCategory]);

  const fetchKits = async () => {
    setLoading(true);
    try {
      // Fetch active kits with establishment info
      const { data: kitsData, error: kitsError } = await supabase
        .from('product_kits')
        .select(`
          id, name, description, kit_price, original_price, image_url, establishment_id,
          establishment:establishments!inner(
            id, name, slug, logo_url, is_open, vila_id,
            delivery_base_fee, min_order_value, accepts_pickup, accepts_delivery,
            status
          )
        `)
        .eq('is_active', true)
        .eq('establishments.status', 'active')
        .limit(20);

      if (kitsError) throw kitsError;

      if (!kitsData || kitsData.length === 0) {
        setKits([]);
        setLoading(false);
        return;
      }

      // Fetch kit items
      const kitIds = kitsData.map(k => k.id);
      const { data: itemsData } = await supabase
        .from('product_kit_items')
        .select('id, kit_id, product_id, quantity')
        .in('kit_id', kitIds);

      // Fetch products for items
      const productIds = (itemsData || []).map(i => i.product_id);
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price, image_url')
        .in('id', productIds.length > 0 ? productIds : ['none']);

      // Map everything together
      const enrichedKits: ProductKit[] = kitsData.map(kit => {
        const kitItems = (itemsData || [])
          .filter(i => i.kit_id === kit.id)
          .map(item => ({
            ...item,
            product: (productsData || []).find(p => p.id === item.product_id),
          }));

        return {
          ...kit,
          establishment: kit.establishment as ProductKit['establishment'],
          items: kitItems,
        };
      });

      setKits(enrichedKits);
    } catch (error) {
      console.error('Error fetching kits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [kits.length, scrollRef]);

  const handleAddToCart = async (kit: ProductKit, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const establishmentInfo: EstablishmentInfo = {
      id: kit.establishment.id,
      name: kit.establishment.name,
      slug: kit.establishment.slug,
      logo_url: kit.establishment.logo_url,
      vila_id: kit.establishment.vila_id,
      delivery_base_fee: kit.establishment.delivery_base_fee || 0,
      min_order_value: kit.establishment.min_order_value || 0,
      accepts_pickup: kit.establishment.accepts_pickup ?? true,
      accepts_delivery: kit.establishment.accepts_delivery ?? true,
    };

    const itemsDescription = kit.items
      .map(item => `${item.quantity}x ${item.product?.name || 'Produto'}`)
      .join(', ');

    const success = await addToCart(
      {
        id: `kit-${kit.id}`,
        name: kit.name,
        price: kit.kit_price,
        promotional_price: null,
        image_url: kit.image_url,
        establishment_id: kit.establishment.id,
      },
      establishmentInfo,
      1,
      `Kit: ${itemsDescription}`
    );

    if (success) {
      toast.success(`${kit.name} adicionado ao carrinho`);
    }
  };

  if (loading) {
    return (
      <section className="py-4 md:py-6">
        <div className="px-4">
          <Skeleton className="h-8 w-48 mb-4" />
        </div>
        <div className="flex gap-3 overflow-hidden pl-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="flex-shrink-0 w-72 h-56 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (kits.length === 0) {
    return null;
  }

  return (
    <section className="py-4 md:py-6">
      {/* Header */}
      <div className="px-4 flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg hidden md:flex bg-primary/10">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
              Combos & Kits
              <Package className="w-3.5 h-3.5 md:hidden text-primary" />
            </h2>
            <p className="text-xs text-muted-foreground hidden md:block">
              Economize com nossos combos especiais
            </p>
          </div>
        </div>
      </div>

      {/* Scroll container */}
      <div className="relative group">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-10 shadow-md transition-opacity bg-card hidden md:flex",
            canScrollLeft ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => scroll("left", 300)}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div
          ref={scrollRef}
          {...handlers}
          className={cn(
            "flex gap-3 overflow-x-auto pb-2 select-none pl-4",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{
            ...scrollStyles,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingRight: '1rem',
            scrollSnapType: isDragging ? 'none' : 'x proximity',
          }}
        >
          {kits.map((kit) => {
            const savings = kit.original_price - kit.kit_price;
            const savingsPercent = Math.round((savings / kit.original_price) * 100);

            return (
              <div
                key={kit.id}
                className="flex-shrink-0 snap-start w-72 bg-card rounded-xl border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => !isDragging && navigate(`/kit/${kit.id}`)}
                style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
              >
                {/* Image */}
                <div className="relative h-32 bg-muted">
                  {kit.image_url ? (
                    <img
                      src={kit.image_url}
                      alt={kit.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}

                  {savingsPercent > 0 && (
                    <Badge className="absolute top-2 left-2 bg-green-500 text-white gap-1">
                      <Tag className="w-3 h-3" />
                      {savingsPercent}% OFF
                    </Badge>
                  )}

                  <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                    KIT
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-3">
                  {/* Establishment */}
                  <div className="flex items-center gap-2 mb-2">
                    {kit.establishment.logo_url ? (
                      <img
                        src={kit.establishment.logo_url}
                        alt={kit.establishment.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                        <Package className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground truncate">
                      {kit.establishment.name}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm mb-1 line-clamp-1">{kit.name}</h3>

                  {/* Items preview */}
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                    {kit.items.slice(0, 3).map(i => i.product?.name).filter(Boolean).join(' + ')}
                    {kit.items.length > 3 && ` +${kit.items.length - 3}`}
                  </p>

                  {/* Price and Add button */}
                  <div className="flex items-center justify-between">
                    <div>
                      {savings > 0 && (
                        <p className="text-xs text-muted-foreground line-through">
                          R$ {kit.original_price.toFixed(2)}
                        </p>
                      )}
                      <p className="text-lg font-bold text-primary">
                        R$ {kit.kit_price.toFixed(2)}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={(e) => handleAddToCart(kit, e)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-10 shadow-md transition-opacity bg-card hidden md:flex",
            canScrollRight ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => scroll("right", 300)}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </section>
  );
};

export default MarketplaceKitsSection;
