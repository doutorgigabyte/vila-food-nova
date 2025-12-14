import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Package, Clock, ZoomIn, Wrench, Download, Leaf, ThermometerSnowflake, Calendar } from "lucide-react";
import type { StoreProduct } from "@/hooks/useStoreData";
import { TouchImageViewer } from "./TouchImageViewer";
import { ProductNutritionalInfo } from "./ProductNutritionalInfo";
import { ProductVariationSelector, VariationGroup } from "./ProductVariationSelector";
import { ProductAdditionalsSelector, AdditionalGroup, SelectedAdditional } from "./ProductAdditionalsSelector";

interface ProductModalProps {
  product: StoreProduct | null;
  onClose: () => void;
  onAddToCart: (product: StoreProduct, quantity: number, observation: string, selectedVariations?: Record<string, string>, selectedAdditionals?: SelectedAdditional[]) => void;
  onRequestService?: (product: StoreProduct) => void;
}

export const ProductModal = ({ product, onClose, onAddToCart, onRequestService }: ProductModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState("");
  const [imageError, setImageError] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [selectedAdditionals, setSelectedAdditionals] = useState<SelectedAdditional[]>([]);

  // Extended product properties - safe access with fallbacks
  const productCategory = (product as any)?.product_category;
  const productType = (product as any)?.product_type;
  const isService = productCategory === 'service' || productType === 'service';
  const isDigital = productCategory === 'digital' || productType === 'digital';
  const isPerishable = productCategory === 'perishable' || productType === 'perishable';
  const serviceDuration = (product as any)?.service_duration;
  const requiresBooking = (product as any)?.requires_booking;
  const expirationDays = (product as any)?.expiration_days;
  const requiresRefrigeration = (product as any)?.requires_refrigeration;
  const digitalInstructions = (product as any)?.digital_instructions;
  
  // Nutritional info
  const nutritionalInfo = (product as any)?.nutritional_info;
  const allergens = (product as any)?.allergens as string[] | null;
  const isVegan = (product as any)?.is_vegan;
  const isVegetarian = (product as any)?.is_vegetarian;
  const isGlutenFree = (product as any)?.is_gluten_free;
  const isLactoseFree = (product as any)?.is_lactose_free;

  // Variations and Additionals from product
  const productVariations = (product as any)?.variations as VariationGroup[] | null;
  const productAdditionals = (product as any)?.additionals as AdditionalGroup[] | null;

  // Calculate additionals total
  const additionalsTotal = useMemo(() => {
    return selectedAdditionals.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [selectedAdditionals]);

  // Calculate variation price modifier
  const variationPriceModifier = useMemo(() => {
    if (!productVariations) return 0;
    let modifier = 0;
    for (const group of productVariations) {
      const selectedId = selectedVariations[group.name];
      if (selectedId) {
        const option = group.options.find(o => o.id === selectedId);
        if (option?.price_modifier) {
          modifier += option.price_modifier;
        }
      }
    }
    return modifier;
  }, [productVariations, selectedVariations]);

  // Check if required selections are complete
  const hasRequiredVariations = useMemo(() => {
    if (!productVariations) return true;
    return productVariations
      .filter(g => g.required)
      .every(g => selectedVariations[g.name]);
  }, [productVariations, selectedVariations]);

  const hasRequiredAdditionals = useMemo(() => {
    if (!productAdditionals) return true;
    return productAdditionals
      .filter(g => g.required && g.min_selection && g.min_selection > 0)
      .every(g => {
        const count = g.items.reduce((sum, item) => {
          const sel = selectedAdditionals.find(a => a.id === item.id);
          return sum + (sel?.quantity || 0);
        }, 0);
        return count >= (g.min_selection || 0);
      });
  }, [productAdditionals, selectedAdditionals]);

  const canAddToCart = hasRequiredVariations && hasRequiredAdditionals;

  // Early return AFTER all hooks
  if (!product) return null;

  // Safe discount calculation
  const hasPromo = Boolean(
    product.promotional_price && 
    product.promotional_price > 0 && 
    product.promotional_price < product.price
  );
  const basePrice = hasPromo ? product.promotional_price! : product.price;
  const displayPrice = basePrice + variationPriceModifier;
  const total = (displayPrice * quantity) + (additionalsTotal * quantity);
  const discount = hasPromo
    ? Math.round(((product.price - product.promotional_price!) / product.price) * 100)
    : 0;
  const showImage = product.image_url && !imageError;

  const handleAdd = () => {
    if (isService && onRequestService) {
      onRequestService(product);
      onClose();
      return;
    }
    onAddToCart(product, quantity, observation, selectedVariations, selectedAdditionals);
    setQuantity(1);
    setObservation("");
    setSelectedVariations({});
    setSelectedAdditionals([]);
    onClose();
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  // Get category badge
  const getCategoryBadge = () => {
    if (isService) {
      return (
        <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <Wrench className="w-3 h-3" />
          Serviço
        </Badge>
      );
    }
    if (isDigital) {
      return (
        <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          <Download className="w-3 h-3" />
          Entrega Imediata
        </Badge>
      );
    }
    if (isPerishable) {
      return (
        <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <Leaf className="w-3 h-3" />
          Perecível
        </Badge>
      );
    }
    return null;
  };

  const categoryBadge = getCategoryBadge();

  return (
    <>
      <Dialog open={!!product} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Product Image */}
          <div 
            className="relative h-56 md:h-64 bg-muted cursor-pointer group"
            onClick={() => showImage && setShowImageViewer(true)}
          >
            {showImage ? (
              <>
                <img
                  src={product.image_url!}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => setImageError(true)}
                />
                {/* Zoom indicator */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-3">
                    <ZoomIn className="w-6 h-6 text-white" />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <Package className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
            {hasPromo && discount > 0 && (
              <Badge variant="destructive" className="absolute top-3 left-3 text-sm px-3 py-1 shadow-lg">
                -{discount}% OFF
              </Badge>
            )}
          </div>

          <div className="p-6 space-y-4">
            <DialogHeader className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <DialogTitle className="text-xl">{product.name}</DialogTitle>
                {product.preparation_time && !isService && (
                  <Badge variant="secondary" className="shrink-0 gap-1">
                    <Clock className="w-3 h-3" />
                    {product.preparation_time} min
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.category && (
                  <Badge variant="outline">{product.category.name}</Badge>
                )}
                {categoryBadge}
              </div>
            </DialogHeader>

            {product.description && (
              <p className="text-muted-foreground text-sm">{product.description}</p>
            )}

            {/* Service specific info */}
            {isService && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2">
                {serviceDuration && (
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                    <Clock className="w-4 h-4" />
                    <span>Duração estimada: {serviceDuration} min</span>
                  </div>
                )}
                {requiresBooking && (
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                    <Calendar className="w-4 h-4" />
                    <span>Requer agendamento prévio</span>
                  </div>
                )}
              </div>
            )}

            {/* Digital product info */}
            {isDigital && digitalInstructions && (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-purple-700 dark:text-purple-400">
                  {digitalInstructions}
                </p>
              </div>
            )}

            {/* Perishable product info */}
            {isPerishable && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-2">
                {expirationDays && (
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                    <Leaf className="w-4 h-4" />
                    <span>Validade: {expirationDays} dias</span>
                  </div>
                )}
                {requiresRefrigeration && (
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                    <ThermometerSnowflake className="w-4 h-4" />
                    <span>Requer refrigeração</span>
                  </div>
                )}
              </div>
            )}

            {/* Nutritional Info and Allergens */}
            <ProductNutritionalInfo
              nutritionalInfo={nutritionalInfo}
              allergens={allergens}
              isVegan={isVegan}
              isVegetarian={isVegetarian}
              isGlutenFree={isGlutenFree}
              isLactoseFree={isLactoseFree}
            />

            {/* Product Variations */}
            {productVariations && productVariations.length > 0 && !isService && (
              <>
                <Separator />
                <ProductVariationSelector
                  variations={productVariations}
                  selectedVariations={selectedVariations}
                  onVariationChange={(groupName, variationId) => 
                    setSelectedVariations(prev => ({ ...prev, [groupName]: variationId }))
                  }
                />
              </>
            )}

            {/* Product Additionals */}
            {productAdditionals && productAdditionals.length > 0 && !isService && (
              <>
                <Separator />
                <ProductAdditionalsSelector
                  additionals={productAdditionals}
                  selectedAdditionals={selectedAdditionals}
                  onAdditionalsChange={setSelectedAdditionals}
                />
              </>
            )}

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">
                R$ {displayPrice.toFixed(2)}
              </span>
              {hasPromo && (
                <span className="text-lg text-muted-foreground line-through">
                  R$ {product.price.toFixed(2)}
                </span>
              )}
              {additionalsTotal > 0 && (
                <span className="text-sm text-muted-foreground">
                  + R$ {additionalsTotal.toFixed(2)} adicionais
                </span>
              )}
            </div>

            {/* Observation - not for services */}
            {!isService && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Alguma observação?</label>
                <Textarea
                  placeholder="Ex: Sem cebola, ponto da carne bem passado..."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="flex items-center justify-between gap-4 pt-2">
              {!isService && (
                <div className="flex items-center gap-3 bg-muted rounded-full p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full touch-manipulation"
                    onClick={() => handleQuantityChange(-1)}
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full touch-manipulation"
                    onClick={() => handleQuantityChange(1)}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              )}

              <Button 
                className={`h-12 text-base font-semibold touch-manipulation ${isService ? 'w-full' : 'flex-1'}`}
                onClick={handleAdd}
                disabled={!isService && !canAddToCart}
              >
                {isService ? (
                  <>
                    <Wrench className="w-4 h-4 mr-2" />
                    Solicitar Serviço
                  </>
                ) : !canAddToCart ? (
                  "Selecione as opções obrigatórias"
                ) : (
                  <>Adicionar • R$ {total.toFixed(2)}</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full screen image viewer */}
      {showImageViewer && showImage && (
        <TouchImageViewer
          src={product.image_url!}
          alt={product.name}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </>
  );
};
