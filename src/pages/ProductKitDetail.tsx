import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Store, 
  Package,
  Tag,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { useCart, CartProduct, EstablishmentInfo } from "@/hooks/useCart";
import MobileBottomNav from "@/components/marketplace/MobileBottomNav";
import { TouchImageViewer } from "@/components/store/TouchImageViewer";

interface KitItem {
  id: string;
  product_id: string;
  quantity: number;
  is_replaceable: boolean;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  } | null;
}

interface ProductKit {
  id: string;
  name: string;
  description: string | null;
  kit_price: number;
  original_price: number;
  image_url: string | null;
  is_active: boolean;
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
  } | null;
  items: KitItem[];
}

const ProductKitDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, getTotalItems } = useCart();
  
  const [kit, setKit] = useState<ProductKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showImageViewer, setShowImageViewer] = useState(false);

  useEffect(() => {
    if (id) {
      fetchKit();
    }
  }, [id]);

  const fetchKit = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Fetch kit basic info
      const { data: kitData, error: kitError } = await supabase
        .from('product_kits')
        .select(`
          id, name, description, kit_price, original_price, image_url, is_active, establishment_id,
          establishment:establishments(
            id, name, slug, logo_url, is_open, vila_id,
            delivery_base_fee, min_order_value, accepts_pickup, accepts_delivery
          )
        `)
        .eq('id', id)
        .single();

      if (kitError) throw kitError;

      // Fetch kit items
      const { data: itemsData, error: itemsError } = await supabase
        .from('product_kit_items')
        .select('id, product_id, quantity, is_replaceable')
        .eq('kit_id', id);

      if (itemsError) throw itemsError;

      // Fetch products for items
      const productIds = (itemsData || []).map(i => i.product_id);
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price, image_url')
        .in('id', productIds.length > 0 ? productIds : ['none']);

      // Map items with products
      const enrichedItems: KitItem[] = (itemsData || []).map(item => ({
        ...item,
        product: (productsData || []).find(p => p.id === item.product_id) || null,
      }));

      setKit({
        ...kitData,
        establishment: kitData.establishment as ProductKit['establishment'],
        items: enrichedItems,
      });
    } catch (error) {
      console.error('Error fetching kit:', error);
      toast.error('Kit não encontrado');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!kit || !kit.establishment) {
      toast.error('Kit indisponível');
      return;
    }

    // Create a cart product from the kit
    const cartProduct: CartProduct = {
      id: `kit-${kit.id}`,
      name: kit.name,
      price: kit.kit_price,
      promotional_price: null,
      image_url: kit.image_url,
      establishment_id: kit.establishment.id,
    };

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

    // Build observation with kit items
    const itemsDescription = kit.items
      .map(item => `${item.quantity}x ${item.product?.name || 'Produto'}`)
      .join(', ');
    const observation = `Kit: ${itemsDescription}`;

    const success = await addToCart(cartProduct, establishmentInfo, quantity, observation);
    
    if (success) {
      toast.success(`${quantity}x ${kit.name} adicionado ao carrinho`);
      setQuantity(1);
    }
  };

  const savings = kit ? kit.original_price - kit.kit_price : 0;
  const savingsPercent = kit ? Math.round((savings / kit.original_price) * 100) : 0;
  const totalPrice = (kit?.kit_price || 0) * quantity;

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Kit não encontrado</h2>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <span className="font-medium truncate max-w-[200px]">{kit.name}</span>
              <Badge className="bg-primary text-primary-foreground">KIT</Badge>
            </div>
            <Link to="/checkout">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Kit Image */}
          <div className="relative">
            <div 
              className="aspect-square rounded-2xl overflow-hidden bg-muted cursor-pointer"
              onClick={() => kit.image_url && setShowImageViewer(true)}
            >
              {kit.image_url ? (
                <img
                  src={kit.image_url}
                  alt={kit.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-muted-foreground/30" />
                </div>
              )}
            </div>
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {savingsPercent > 0 && (
                <Badge className="bg-green-500 text-white font-bold gap-1">
                  <Tag className="w-3 h-3" />
                  {savingsPercent}% OFF
                </Badge>
              )}
            </div>
          </div>

          {/* Kit Info */}
          <div className="space-y-6">
            {/* Establishment */}
            {kit.establishment && (
              <Link 
                to={`/loja/${kit.establishment.slug}`}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
              >
                {kit.establishment.logo_url ? (
                  <img
                    src={kit.establishment.logo_url}
                    alt={kit.establishment.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Store className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{kit.establishment.name}</p>
                  <p className="text-sm text-muted-foreground">Ver cardápio completo</p>
                </div>
                <Badge variant={kit.establishment.is_open ? "default" : "secondary"}>
                  {kit.establishment.is_open ? "Aberto" : "Fechado"}
                </Badge>
              </Link>
            )}

            {/* Name */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{kit.name}</h1>
              {kit.description && (
                <p className="text-muted-foreground mt-2">{kit.description}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              {savings > 0 && (
                <span className="text-lg text-muted-foreground line-through">
                  R$ {kit.original_price.toFixed(2)}
                </span>
              )}
              <span className="text-3xl font-bold text-primary">
                R$ {kit.kit_price.toFixed(2)}
              </span>
            </div>

            {/* Savings */}
            {savings > 0 && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                <Check className="w-5 h-5" />
                <span className="font-medium">
                  Você economiza R$ {savings.toFixed(2)} com este kit!
                </span>
              </div>
            )}

            <Separator />

            {/* Kit Items */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Itens inclusos no kit ({kit.items.length})
              </h3>
              <div className="space-y-2">
                {kit.items.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    {item.product?.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {item.product?.name || 'Produto'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Quantidade: {item.quantity}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {item.quantity}x
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-4 pb-safe z-40">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-4">
            {/* Quantity */}
            <div className="flex items-center gap-2 bg-muted rounded-full p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Add to cart button */}
            <Button 
              className="flex-1 h-12 text-lg font-bold"
              onClick={handleAddToCart}
              disabled={kit.establishment?.is_open === false}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Adicionar • R$ {totalPrice.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {showImageViewer && kit.image_url && (
        <TouchImageViewer
          src={kit.image_url}
          alt={kit.name}
          onClose={() => setShowImageViewer(false)}
        />
      )}

      <MobileBottomNav />
    </div>
  );
};

export default ProductKitDetail;
