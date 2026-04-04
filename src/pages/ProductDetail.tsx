import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Store, 
  Heart,
  Share2,
  Clock,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { useCart, CartProduct, EstablishmentInfo } from "@/hooks/useCart";
import MobileBottomNav from "@/components/marketplace/MobileBottomNav";
import { TouchImageViewer } from "@/components/store/TouchImageViewer";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  preparation_time: number | null;
  variations: any[] | null;
  additionals: any[] | null;
  product_type?: string | null;
  temperature_options?: string[] | null;
  category: {
    id: string;
    name: string;
  } | null;
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
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, getTotalItems } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState("");
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [selectedAdditionals, setSelectedAdditionals] = useState<string[]>([]);
  const [showImageViewer, setShowImageViewer] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, description, price, promotional_price, image_url,
          is_active, is_featured, preparation_time, variations, additionals,
          product_type, temperature_options,
          category:categories(id, name),
          establishment:establishments(
            id, name, slug, logo_url, is_open, vila_id,
            delivery_base_fee, min_order_value, accepts_pickup, accepts_delivery
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data as unknown as Product);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Produto não encontrado');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !product.establishment) {
      toast.error('Produto indisponível');
      return;
    }

    const cartProduct: CartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      promotional_price: product.promotional_price,
      image_url: product.image_url,
      establishment_id: product.establishment.id,
      product_type: product.product_type || undefined,
      temperature_options: product.temperature_options || undefined,
    };

    const establishmentInfo: EstablishmentInfo = {
      id: product.establishment.id,
      name: product.establishment.name,
      slug: product.establishment.slug,
      logo_url: product.establishment.logo_url,
      vila_id: product.establishment.vila_id,
      delivery_base_fee: product.establishment.delivery_base_fee || 0,
      min_order_value: product.establishment.min_order_value || 0,
      accepts_pickup: product.establishment.accepts_pickup ?? true,
      accepts_delivery: product.establishment.accepts_delivery ?? true,
    };

    const success = await addToCart(cartProduct, establishmentInfo, quantity, observation);
    
    if (success) {
      toast.success(`${quantity}x ${product.name} adicionado ao carrinho`);
      setQuantity(1);
      setObservation("");
    }
  };

  const currentPrice = product?.promotional_price || product?.price || 0;
  const totalPrice = currentPrice * quantity;
  const discount = product?.promotional_price && product.promotional_price < product.price
    ? Math.round(((product.price - product.promotional_price) / product.price) * 100)
    : null;

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

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Produto não encontrado</h2>
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
              <span className="font-medium truncate max-w-[200px]">{product.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="w-5 h-5" />
              </Button>
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="relative">
            <div 
              className="aspect-square rounded-2xl overflow-hidden bg-muted cursor-pointer"
              onClick={() => product.image_url && setShowImageViewer(true)}
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl opacity-30">🍽️</span>
                </div>
              )}
            </div>
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {discount && (
                <Badge className="bg-destructive text-destructive-foreground font-bold">
                  {discount}% OFF
                </Badge>
              )}
              {product.is_featured && (
                <Badge className="bg-amber-500 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Destaque
                </Badge>
              )}
            </div>

            {/* Closed badge */}
            {product.establishment?.is_open === false && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium">Loja fechada</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Establishment */}
            {product.establishment && (
              <Link 
                to={`/loja/${product.establishment.slug}`}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
              >
                {product.establishment.logo_url ? (
                  <img
                    src={product.establishment.logo_url}
                    alt={product.establishment.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Store className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.establishment.name}</p>
                  <p className="text-sm text-muted-foreground">Ver cardápio completo</p>
                </div>
                <Badge variant={product.establishment.is_open ? "default" : "secondary"}>
                  {product.establishment.is_open ? "Aberto" : "Fechado"}
                </Badge>
              </Link>
            )}

            {/* Name and Category */}
            <div>
              {product.category && (
                <p className="text-sm text-muted-foreground mb-1">{product.category.name}</p>
              )}
              <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              {product.promotional_price && product.promotional_price < product.price && (
                <span className="text-lg text-muted-foreground line-through">
                  R$ {product.price.toFixed(2)}
                </span>
              )}
              <span className="text-3xl font-bold text-primary">
                R$ {currentPrice.toFixed(2)}
              </span>
            </div>

            {/* Preparation time */}
            {product.preparation_time && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Tempo de preparo: ~{product.preparation_time} min</span>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-medium mb-2">Descrição</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            <Separator />

            {/* Observation */}
            <div>
              <h3 className="font-medium mb-2">Alguma observação?</h3>
              <Textarea
                placeholder="Ex: Sem cebola, bem passado..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="resize-none"
                rows={3}
              />
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
              disabled={product.establishment?.is_open === false}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Adicionar • R$ {totalPrice.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {showImageViewer && product.image_url && (
        <TouchImageViewer
          src={product.image_url}
          alt={product.name}
          onClose={() => setShowImageViewer(false)}
        />
      )}

      <MobileBottomNav />
    </div>
  );
};

export default ProductDetail;