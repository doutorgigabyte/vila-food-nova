import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from "@/components/ui/resizable";
import { 
  Search,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  Check,
  Receipt,
  MessageCircle,
  Send,
  Truck,
  MapPin,
  GripVertical,
  Maximize2,
  Minimize2,
  Grid3X3,
  LayoutGrid,
  Package,
  ChefHat,
  Percent,
  Calculator,
  Settings2
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDragToCart } from "@/hooks/useDragToCart";
import { PDVPaymentModal } from "@/components/pdv/PDVPaymentModal";
import type { Json } from "@/integrations/supabase/types";

interface Category {
  id: string;
  name: string;
  image_url: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  category_id: string | null;
}

interface CartItem extends Product {
  quantity: number;
  notes?: string;
}

interface Establishment {
  id: string;
  name: string;
  whatsapp: string | null;
  pix_key: string | null;
  mercado_pago_token: string | null;
  delivery_base_fee: number | null;
  delivery_fee_per_km: number | null;
  point_terminal_id: string | null;
  point_device_name: string | null;
}

const PDV = () => {
  const { slug } = useParams<{ slug: string }>();
  const isMobile = useIsMobile();
  
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Mode toggle
  const [tokenMode, setTokenMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Order settings
  const [orderType, setOrderType] = useState<'takeaway' | 'delivery' | 'table'>('takeaway');
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'credit_card' | 'debit_card'>('cash');
  const [observations, setObservations] = useState("");
  const [discount, setDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  
  // Card fees by payment method (%)
  const [cardFees, setCardFees] = useState({
    credit_card: 3.0,  // Default 3% for credit
    debit_card: 1.5,   // Default 1.5% for debit
    pix: 0,
    cash: 0
  });
  const [showCardFeesConfig, setShowCardFeesConfig] = useState(false);
  const [changeFor, setChangeFor] = useState<number | null>(null);
  
  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [generatingPix, setGeneratingPix] = useState(false);

  // Drag and drop
  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    
    // Sound feedback
    try {
      const audio = new Audio('/sounds/add.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
    
    // Vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    
    toast.success(`${product.name} adicionado`, { duration: 1000 });
  }, []);

  const { dragState, dropZoneRef, handlers } = useDragToCart(addToCart);

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug]);

  // Auto-detect touch device for token mode
  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (hasTouch && isMobile) {
      setTokenMode(true);
    }
  }, [isMobile]);

  const fetchData = async () => {
    if (!slug) return;
    
    try {
      // Fetch establishment by slug
      const { data: estData, error: estError } = await supabase
        .from('establishments')
        .select('id, name, whatsapp, pix_key, mercado_pago_token, delivery_base_fee, delivery_fee_per_km, point_terminal_id, point_device_name')
        .eq('slug', slug)
        .single();

      if (estError) throw estError;
      if (!estData) {
        toast.error('Estabelecimento não encontrado');
        return;
      }

      setEstablishment(estData);

      // Fetch categories for this establishment
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name, image_url')
        .eq('establishment_id', estData.id)
        .eq('is_active', true)
        .order('sort_order');

      setCategories(catData || []);

      // Fetch products for this establishment
      const { data: prodData } = await supabase
        .from('products')
        .select('id, name, description, price, promotional_price, image_url, category_id')
        .eq('establishment_id', estData.id)
        .eq('is_active', true);

      setProducts(prodData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setDeliveryFee(0);
    setObservations("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setTableNumber("");
    setChangeFor(null);
  };

  const subtotal = cart.reduce((sum, item) => {
    const price = item.promotional_price || item.price;
    return sum + (price * item.quantity);
  }, 0);

  // Card fee based on selected payment method
  const currentCardFee = cardFees[paymentMethod] || 0;
  const cardFeeAmount = (subtotal * currentCardFee) / 100;
  const total = subtotal + cardFeeAmount - discount + (orderType === 'delivery' ? deliveryFee : 0);

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Generate WhatsApp message with PIX link
  const generateWhatsAppMessage = async (): Promise<string> => {
    if (!establishment) return '';

    let pixInfo = '';
    
    // Try to generate dynamic PIX if Mercado Pago is configured
    if (establishment.mercado_pago_token) {
      setGeneratingPix(true);
      try {
        const { data, error } = await supabase.functions.invoke('mercadopago-pix', {
          body: {
            establishment_id: establishment.id,
            order_id: `temp-${Date.now()}`,
            amount: total,
            description: `Pedido ${establishment.name}`,
            payer: {
              email: 'cliente@email.com',
              name: customerName || 'Cliente'
            }
          }
        });

        if (!error && data?.qr_code_base64) {
          pixInfo = `\n\n💳 *Pagar via PIX:*\nCopia e Cola: ${data.qr_code || 'Escaneie o QR Code'}`;
        }
      } catch (error) {
        console.error('Error generating PIX:', error);
      } finally {
        setGeneratingPix(false);
      }
    } else if (establishment.pix_key) {
      pixInfo = `\n\n💳 *Chave PIX:* ${establishment.pix_key}`;
    }

    const itemsList = cart.map(item => {
      const price = item.promotional_price || item.price;
      return `${item.quantity}x ${item.name} - R$ ${(price * item.quantity).toFixed(2)}`;
    }).join('\n');

    const orderTypeLabel = orderType === 'delivery' ? '🚚 Delivery' : 
                          orderType === 'table' ? `🍽️ Mesa ${tableNumber}` : 
                          '🛍️ Retirada';

    let message = `🛒 *Resumo do Pedido - ${establishment.name}*\n\n`;
    message += `${orderTypeLabel}\n`;
    if (customerName) message += `👤 Cliente: ${customerName}\n`;
    if (orderType === 'delivery' && customerAddress) {
      message += `📍 Endereço: ${customerAddress}\n`;
    }
    message += `\n📦 *Itens:*\n${itemsList}\n`;
    message += `\n━━━━━━━━━━━━━━━\n`;
    message += `Subtotal: R$ ${subtotal.toFixed(2)}\n`;
    if (discount > 0) message += `Desconto: -R$ ${discount.toFixed(2)}\n`;
    if (orderType === 'delivery' && deliveryFee > 0) {
      message += `Frete: R$ ${deliveryFee.toFixed(2)}\n`;
    }
    message += `\n💰 *TOTAL: R$ ${total.toFixed(2)}*`;
    message += pixInfo;
    if (observations) message += `\n\n📝 Obs: ${observations}`;

    return message;
  };

  // Send to WhatsApp
  const sendToWhatsApp = async () => {
    if (!customerPhone) {
      toast.error('Informe o telefone do cliente');
      return;
    }

    const message = await generateWhatsAppMessage();
    const phone = customerPhone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
    setShowWhatsAppModal(false);
    toast.success('Abrindo WhatsApp...');
  };

  // Print receipt
  const printReceipt = (orderNumber: number) => {
    const printContent = `
      <html>
        <head>
          <title>Comanda #${orderNumber}</title>
          <style>
            body { font-family: monospace; font-size: 12px; width: 280px; margin: 0; padding: 10px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>COMANDA #${orderNumber}</h2>
            <p>${new Date().toLocaleString('pt-BR')}</p>
            <p>${orderType === 'delivery' ? 'DELIVERY' : orderType === 'takeaway' ? 'RETIRADA' : 'MESA ' + tableNumber}</p>
          </div>
          ${customerName ? `<p><strong>Cliente:</strong> ${customerName}</p>` : ''}
          <div class="divider"></div>
          <div class="items">
            ${cart.map(item => `
              <div class="item">
                <span>${item.quantity}x ${item.name}</span>
                <span>R$ ${((item.promotional_price || item.price) * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <div class="item"><span>Subtotal:</span><span>R$ ${subtotal.toFixed(2)}</span></div>
            ${discount > 0 ? `<div class="item"><span>Desconto:</span><span>-R$ ${discount.toFixed(2)}</span></div>` : ''}
            ${orderType === 'delivery' && deliveryFee > 0 ? `<div class="item"><span>Frete:</span><span>R$ ${deliveryFee.toFixed(2)}</span></div>` : ''}
            <div class="item" style="font-size: 16px;"><span>TOTAL:</span><span>R$ ${total.toFixed(2)}</span></div>
          </div>
          <div class="divider"></div>
          <p><strong>Pagamento:</strong> ${
            paymentMethod === 'cash' ? 'Dinheiro' : 
            paymentMethod === 'pix' ? 'PIX' : 
            paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito'
          }</p>
          ${paymentMethod === 'cash' && changeFor ? `<p><strong>Troco para:</strong> R$ ${changeFor.toFixed(2)}</p>` : ''}
          ${observations ? `<p><strong>Obs:</strong> ${observations}</p>` : ''}
          <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p>${establishment?.name || 'VilaFood'}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Process order
  const processOrder = async () => {
    if (!establishment) {
      toast.error('Estabelecimento não encontrado');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Adicione itens ao carrinho');
      return;
    }

    setProcessingOrder(true);

    try {
      const orderItems: Json = cart.map(item => ({
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.promotional_price || item.price,
        notes: item.notes || null
      }));

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          establishment_id: establishment.id,
          status: 'confirmed',
          delivery_type: orderType === 'table' ? 'table' : orderType === 'delivery' ? 'delivery' : 'pickup',
          payment_method: paymentMethod,
          items: orderItems,
          subtotal: subtotal,
          discount: discount,
          delivery_fee: orderType === 'delivery' ? deliveryFee : 0,
          total: total,
          table_number: orderType === 'table' ? tableNumber : null,
          observations: observations || null,
          change_for: changeFor,
          delivery_address: orderType === 'delivery' && customerAddress ? { address: customerAddress } : null
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Pedido #${order.order_number} criado com sucesso!`);
      printReceipt(order.order_number);
      clearCart();
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erro ao criar pedido');
    } finally {
      setProcessingOrder(false);
    }
  };

  // Calculate grid columns based on mode
  const gridCols = tokenMode 
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' 
    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4';

  // Product card with drag support
  const ProductCard = ({ product }: { product: Product }) => {
    const cardSize = tokenMode ? 'min-h-[140px]' : '';
    
    return (
      <Card 
        className={`overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-lg transition-all group touch-manipulation select-none ${cardSize}`}
        draggable
        onDragStart={(e) => handlers.onDragStart(e, product)}
        onDragEnd={handlers.onDragEnd}
        onTouchStart={(e) => handlers.onTouchStart(e, product)}
        onTouchMove={handlers.onTouchMove}
        onTouchEnd={handlers.onTouchEnd}
        onClick={() => addToCart(product)}
      >
        <div className={`aspect-square bg-muted relative overflow-hidden ${tokenMode ? 'aspect-[4/3]' : ''}`}>
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform pointer-events-none"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-muted to-muted/50">
              🍽️
            </div>
          )}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-primary text-primary-foreground rounded-full p-1.5">
              <Plus className="w-4 h-4" />
            </div>
          </div>
          <div className="absolute top-2 left-2 opacity-50 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-5 h-5 text-white drop-shadow-lg" />
          </div>
        </div>
        <CardContent className={`p-3 ${tokenMode ? 'p-4' : ''}`}>
          <h3 className={`font-medium truncate ${tokenMode ? 'text-base' : 'text-sm'}`}>{product.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {product.promotional_price ? (
              <>
                <span className="text-xs text-muted-foreground line-through">
                  R$ {product.price.toFixed(2)}
                </span>
                <span className={`font-bold text-primary ${tokenMode ? 'text-lg' : ''}`}>
                  R$ {product.promotional_price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className={`font-bold text-primary ${tokenMode ? 'text-lg' : ''}`}>
                R$ {product.price.toFixed(2)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Ghost element for touch drag
  const DragGhost = () => {
    if (!dragState.isDragging || !dragState.ghostPosition || !dragState.draggedItem) {
      return null;
    }

    return (
      <div
        className="fixed pointer-events-none z-[9999] bg-card border-2 border-primary rounded-lg shadow-2xl p-3 min-w-[120px] opacity-90"
        style={{
          left: dragState.ghostPosition.x - 60,
          top: dragState.ghostPosition.y - 40,
          transform: 'rotate(-3deg)',
        }}
      >
        <p className="font-medium text-sm truncate">{dragState.draggedItem.name}</p>
        <p className="text-primary font-bold text-sm">
          R$ {(dragState.draggedItem.promotional_price || dragState.draggedItem.price).toFixed(2)}
        </p>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando PDV...</p>
        </div>
      </div>
    );
  }

  // No establishment found
  if (!establishment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-2">Estabelecimento não encontrado</p>
          <Link to="/painel">
            <Button>Voltar ao Painel</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <DragGhost />
      
      {/* Header */}
      <header className="bg-card border-b border-border p-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link to={`/painel/${slug}`}>
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold truncate">PDV</h1>
              <p className="text-xs text-muted-foreground truncate">{establishment.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to={`/painel/${slug}/cozinha`}>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <ChefHat className="w-4 h-4 mr-1" />
                Cozinha
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTokenMode(!tokenMode)}
              title={tokenMode ? 'Modo Desktop' : 'Modo Token'}
            >
              {tokenMode ? <LayoutGrid className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Sair Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Resizable Columns (Desktop) / Stacked (Mobile) */}
      <div className="flex-1 flex flex-col lg:hidden overflow-hidden min-h-0">
        {/* Mobile Layout */}
        {/* Mobile Categories - Horizontal */}
        <div className="bg-card border-b border-border p-2 overflow-x-auto shrink-0">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={tokenMode ? 'text-base px-4' : ''}
            >
              Todos
            </Button>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap ${tokenMode ? 'text-base px-4' : ''}`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="bg-card border-b border-border p-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              className={`pl-10 ${tokenMode ? 'h-12 text-lg' : ''}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Mobile Products Grid */}
        <div className="flex-1 p-3 overflow-y-auto min-h-0">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className={`grid gap-3 ${tokenMode ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Mobile Cart - Bottom Fixed */}
        <div 
          ref={dropZoneRef}
          className={`bg-card border-t border-border flex flex-col shrink-0 h-[40dvh] ${
            dragState.isDragging ? 'ring-2 ring-primary ring-dashed bg-primary/5' : ''
          }`}
          onDragOver={handlers.onDragOver}
          onDrop={handlers.onDrop}
        >
          {/* Cart Header */}
          <div className="p-3 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold flex items-center gap-2 text-sm">
                <ShoppingCart className="w-4 h-4" />
                Carrinho
                {cart.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{cart.reduce((sum, item) => sum + item.quantity, 0)}</Badge>
                )}
              </h2>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart} className="h-7 text-xs">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            {/* Order Type */}
            <div className="grid grid-cols-3 gap-1">
              <Button
                variant={orderType === 'takeaway' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType('takeaway')}
                className="text-xs h-8"
              >
                Retirada
              </Button>
              <Button
                variant={orderType === 'delivery' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType('delivery')}
                className="text-xs h-8"
              >
                <Truck className="w-3 h-3 mr-1" />
                Entrega
              </Button>
              <Button
                variant={orderType === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType('table')}
                className="text-xs h-8"
              >
                Mesa
              </Button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
            {cart.length === 0 ? (
              <div className="text-center py-4">
                <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground/30 mb-1" />
                <p className="text-sm text-muted-foreground">Arraste produtos aqui</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-2 p-2 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm">🍽️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-xs truncate">{item.name}</h4>
                    <p className="text-primary font-bold text-xs">
                      R$ {((item.promotional_price || item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button variant="outline" size="icon" className="w-6 h-6" onClick={() => updateQuantity(item.id, -1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-5 text-center font-medium text-xs">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="w-6 h-6" onClick={() => updateQuantity(item.id, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-6 h-6 text-destructive" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile Cart Footer */}
          <div className="border-t border-border p-3 shrink-0">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-lg text-primary">R$ {total.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-10 text-xs" disabled={cart.length === 0} onClick={() => setShowWhatsAppModal(true)}>
                <MessageCircle className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
              <Button className="h-10 text-xs" disabled={cart.length === 0} onClick={() => setShowPaymentModal(true)}>
                <Receipt className="w-4 h-4 mr-1" />
                Finalizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - 3 Resizable Columns */}
      <div className="hidden lg:flex flex-1 overflow-hidden min-h-0">
        <ResizablePanelGroup direction="horizontal" className="w-full">
          {/* Left Panel - Cart */}
          <ResizablePanel defaultSize={25} minSize={18} maxSize={40}>
            <div 
              ref={dropZoneRef}
              className={`h-full bg-card flex flex-col ${
                dragState.isDragging ? 'ring-2 ring-primary ring-dashed bg-primary/5' : ''
              }`}
              onDragOver={handlers.onDragOver}
              onDrop={handlers.onDrop}
            >
              {/* Cart Header */}
              <div className="p-3 border-b border-border shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold flex items-center gap-2 text-sm">
                    <ShoppingCart className="w-4 h-4" />
                    Carrinho
                    {cart.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{cart.reduce((sum, item) => sum + item.quantity, 0)}</Badge>
                    )}
                  </h2>
                  {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart} className="h-7 text-xs">
                      <Trash2 className="w-3 h-3 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>

                {/* Order Type */}
                <div className="grid grid-cols-3 gap-1">
                  <Button
                    variant={orderType === 'takeaway' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOrderType('takeaway')}
                    className="text-xs h-8"
                  >
                    Retirada
                  </Button>
                  <Button
                    variant={orderType === 'delivery' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOrderType('delivery')}
                    className="text-xs h-8"
                  >
                    <Truck className="w-3 h-3 mr-1" />
                    Entrega
                  </Button>
                  <Button
                    variant={orderType === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOrderType('table')}
                    className="text-xs h-8"
                  >
                    Mesa
                  </Button>
                </div>

                {orderType === 'table' && (
                  <Input
                    placeholder="Nº da mesa"
                    className="mt-2 h-8 text-sm"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  />
                )}
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Arraste produtos aqui</p>
                    <p className="text-xs text-muted-foreground">ou clique para adicionar</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-2 p-2 bg-muted/50 rounded-lg">
                      <div className="w-10 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm">🍽️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs truncate">{item.name}</h4>
                        <p className="text-primary font-bold text-xs">
                          R$ {((item.promotional_price || item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-6 h-6"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-5 text-center font-medium text-xs">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-6 h-6"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 text-destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer - Calculations */}
              <div className="border-t border-border p-3 space-y-2 shrink-0">
                {/* Customer */}
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-xs h-8"
                  onClick={() => setShowCustomerModal(true)}
                >
                  <User className="w-3 h-3 mr-1 shrink-0" />
                  <span className="truncate">{customerName || 'Adicionar cliente'}</span>
                </Button>

                {/* Card Fee Display & Discount Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-muted-foreground shrink-0" />
                    <div className="flex-1 flex items-center gap-1">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Taxa {currentCardFee > 0 ? `${currentCardFee}%` : '-'}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setShowCardFeesConfig(!showCardFeesConfig)}
                        title="Configurar taxas"
                      >
                        <Settings2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calculator className="w-3 h-3 text-muted-foreground shrink-0" />
                    <Input
                      type="number"
                      min="0"
                      className="h-7 text-xs"
                      value={discount || ''}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="Desconto R$"
                    />
                  </div>
                </div>

                {/* Card Fees Configuration (Collapsible) */}
                {showCardFeesConfig && (
                  <div className="bg-muted/50 rounded-lg p-2 space-y-2 text-xs">
                    <p className="font-medium text-muted-foreground">Taxas da Maquininha:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground w-14">Crédito:</span>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          className="h-6 text-xs"
                          value={cardFees.credit_card}
                          onChange={(e) => setCardFees(prev => ({ ...prev, credit_card: parseFloat(e.target.value) || 0 }))}
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground w-14">Débito:</span>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          className="h-6 text-xs"
                          value={cardFees.debit_card}
                          onChange={(e) => setCardFees(prev => ({ ...prev, debit_card: parseFloat(e.target.value) || 0 }))}
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                )}

                {orderType === 'delivery' && (
                  <div className="flex items-center gap-1">
                    <Truck className="w-3 h-3 text-muted-foreground shrink-0" />
                    <Input
                      type="number"
                      min="0"
                      className="h-7 text-xs flex-1"
                      value={deliveryFee || ''}
                      onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                      placeholder="Taxa entrega R$"
                    />
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-0.5 text-xs bg-muted/50 rounded-lg p-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {currentCardFee > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Taxa Cartão ({currentCardFee}%):</span>
                      <span>+R$ {cardFeeAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto:</span>
                      <span>-R$ {discount.toFixed(2)}</span>
                    </div>
                  )}
                  {orderType === 'delivery' && deliveryFee > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Entrega:</span>
                      <span>+R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                    <span>Total:</span>
                    <span className="text-primary">R$ {total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    className="h-10 text-xs" 
                    disabled={cart.length === 0}
                    onClick={() => setShowWhatsAppModal(true)}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    WhatsApp
                  </Button>
                  <Button 
                    className="h-10 text-xs" 
                    disabled={cart.length === 0}
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <Receipt className="w-4 h-4 mr-1" />
                    Finalizar
                  </Button>
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center Panel - Products */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <div className="h-full flex flex-col">
              {/* Search */}
              <div className="bg-card border-b border-border p-3 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto..."
                    className={`pl-10 ${tokenMode ? 'h-12 text-lg' : ''}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Products Grid - Scrollable */}
              <div className="flex-1 p-3 overflow-y-auto min-h-0 bg-muted/20">
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Package className="h-12 w-12 text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">Nenhum produto encontrado</p>
                  </div>
                ) : (
                  <div className={`grid gap-3 ${tokenMode ? 'grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'}`}>
                    {filteredProducts.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Categories */}
          <ResizablePanel defaultSize={20} minSize={12} maxSize={30}>
            <div className="h-full bg-card flex flex-col">
              <div className="p-3 border-b border-border">
                <h3 className="font-semibold text-sm">Categorias</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* All Products */}
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                    selectedCategory === null 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium truncate">Todos</span>
                </button>

                {/* Category List */}
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                      {category.image_url ? (
                        <img 
                          src={category.image_url} 
                          alt={category.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">
                          📁
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium truncate">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Payment Modal - New Version with PIX QR, Cash Change, Terminal */}
      <PDVPaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={(method, paymentId) => {
          setPaymentMethod(method as any);
          processOrder();
        }}
        total={total}
        establishmentId={establishment?.id || ''}
        establishmentName={establishment?.name || ''}
        hasTerminal={!!establishment?.point_terminal_id}
        hasMercadoPago={!!establishment?.mercado_pago_token || !!establishment?.pix_key}
      />

      {/* Customer Modal */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dados do Cliente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Nome</Label>
              <Input
                placeholder="Nome do cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">Telefone</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            {orderType === 'delivery' && (
              <div>
                <Label className="mb-2 block">Endereço de Entrega</Label>
                <Textarea
                  placeholder="Rua, número, bairro..."
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerModal(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowCustomerModal(false)}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Modal */}
      <Dialog open={showWhatsAppModal} onOpenChange={setShowWhatsAppModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              Enviar para WhatsApp
            </DialogTitle>
            <DialogDescription>
              O pedido será enviado para o WhatsApp do cliente com o resumo e link de pagamento PIX.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Nome do Cliente</Label>
              <Input
                placeholder="Nome do cliente"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">Telefone do Cliente *</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            {orderType === 'delivery' && (
              <>
                <div>
                  <Label className="mb-2 block">Endereço de Entrega</Label>
                  <Textarea
                    placeholder="Rua, número, bairro..."
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Taxa de Entrega</Label>
                  <Input
                    type="number"
                    placeholder="R$ 0,00"
                    value={deliveryFee || ''}
                    onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWhatsAppModal(false)}>
              Cancelar
            </Button>
            <Button onClick={sendToWhatsApp} disabled={!customerPhone || generatingPix}>
              {generatingPix ? (
                <>Gerando PIX...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDV;
