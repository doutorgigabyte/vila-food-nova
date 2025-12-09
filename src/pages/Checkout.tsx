import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Banknote, 
  QrCode,
  Store,
  Clock,
  AlertCircle,
  CheckCircle,
  ShoppingBag,
  AlertTriangle,
  Bookmark,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { Price } from "@/components/ui/price";
import { useCart } from "@/hooks/useCart";
import { useCreateOrder } from "@/hooks/useCreateOrder";
import { useAuth } from "@/hooks/useAuth";
import { useSavedAddresses, SavedAddress } from "@/hooks/useSavedAddresses";
import { useOrderSource } from "@/hooks/useOrderSource";
import { SmartAddressInput } from "@/components/address";
import { SavedAddressSelector } from "@/components/checkout/SavedAddressSelector";
import { SaveAddressDialog } from "@/components/checkout/SaveAddressDialog";
import { PaymentProcessor } from "@/components/checkout/PaymentProcessor";
import { CheckoutProPayment } from "@/components/checkout/CheckoutProPayment";
import { CartConfirmationStep } from "@/components/checkout/CartConfirmationStep";
import { DeliveryOptionsCards } from "@/components/checkout/DeliveryOptionsCards";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { CouponInput } from "@/components/checkout/CouponInput";
import { GatewaySelector, GatewayProvider } from "@/components/checkout/GatewaySelector";
import { trackInitiateCheckout, trackPurchase } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";

type CheckoutStep = "cart" | "delivery" | "payment" | "processing" | "success";

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeSlug = searchParams.get("store");
  
  const { 
    items, 
    establishments, 
    isLoaded,
    getUniqueEstablishments, 
    getEstablishmentItems, 
    getEstablishmentSubtotal,
    isMultiEstablishment,
    updateQuantity,
    updateItemTemperature,
    removeFromCart,
    clearCart
  } = useCart();

  const { createOrder, loading: creatingOrder } = useCreateOrder();
  const { source, shouldApplyPlatformFee, platformFeePercent } = useOrderSource();

  const [step, setStep] = useState<CheckoutStep>("cart");
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [selectedGateway, setSelectedGateway] = useState<GatewayProvider>("mercadopago");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [currentEstablishmentId, setCurrentEstablishmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<string[]>([]);
  
  // Coupon
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountValue: number; discountType: string } | null>(null);
  
  // Address form
  const [addressData, setAddressData] = useState<{
    cep: string;
    address: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    reference: string;
    lat?: number;
    lng?: number;
    formatted_address?: string;
  }>({
    cep: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    reference: "",
  });
  
  // Payment
  const [change, setChange] = useState("");
  const [observations, setObservations] = useState("");
  
  // WhatsApp tracking
  const [whatsappTracking, setWhatsappTracking] = useState(true);
  const [customerPhone, setCustomerPhone] = useState("");
  
  // Saved addresses
  const { user, session } = useAuth();
  const { addresses: savedAddresses, isAuthenticated, getDefaultAddress } = useSavedAddresses();
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | undefined>();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saveAddressDialogOpen, setSaveAddressDialogOpen] = useState(false);

  // Pre-fill phone from user profile
  useEffect(() => {
    if (user?.id && !customerPhone) {
      supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.phone) {
            // Format phone number
            const value = data.phone.replace(/\D/g, '');
            let formatted = value;
            if (value.length > 2) {
              formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            }
            if (value.length > 7) {
              formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
            }
            setCustomerPhone(formatted);
          }
        });
    }
  }, [user?.id, customerPhone]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [step]);

  const uniqueEstablishments = getUniqueEstablishments();
  const isMultiStore = isMultiEstablishment();

  // Auto-select default address when available
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedSavedAddressId && !showAddressForm) {
      const defaultAddr = getDefaultAddress();
      if (defaultAddr) {
        setSelectedSavedAddressId(defaultAddr.id);
        setAddressData({
          cep: defaultAddr.cep,
          address: defaultAddr.address,
          number: defaultAddr.number,
          complement: defaultAddr.complement || "",
          neighborhood: defaultAddr.neighborhood,
          city: defaultAddr.city,
          state: defaultAddr.state,
          reference: defaultAddr.reference || "",
          lat: defaultAddr.lat,
          lng: defaultAddr.lng,
          formatted_address: defaultAddr.formatted_address || "",
        });
      }
    }
  }, [savedAddresses, selectedSavedAddressId, showAddressForm, getDefaultAddress]);

  const handleSelectSavedAddress = (address: SavedAddress) => {
    setSelectedSavedAddressId(address.id);
    setShowAddressForm(false);
    setAddressData({
      cep: address.cep,
      address: address.address,
      number: address.number,
      complement: address.complement || "",
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      reference: address.reference || "",
      lat: address.lat,
      lng: address.lng,
      formatted_address: address.formatted_address || "",
    });
  };

  const handleAddNewAddress = () => {
    setSelectedSavedAddressId(undefined);
    setShowAddressForm(true);
    setAddressData({
      cep: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      reference: "",
    });
  };

  // For multi-establishment orders, force pickup only
  useEffect(() => {
    if (isMultiStore) {
      setDeliveryType("pickup");
    }
  }, [isMultiStore]);

  // Redirect if cart is empty (only after cart is loaded from localStorage)
  useEffect(() => {
    if (isLoaded && items.length === 0 && step !== "success") {
      navigate(storeSlug ? `/loja/${storeSlug}` : "/marketplace");
    }
  }, [isLoaded, items.length, step, storeSlug, navigate]);

  // Check if any establishment is closed
  const checkIfStoreOpen = () => {
    for (const estId of uniqueEstablishments) {
      const estInfo = establishments.get(estId);
      if (!estInfo?.is_open) {
        return { isOpen: false, storeName: estInfo?.name || 'Estabelecimento' };
      }
    }
    return { isOpen: true, storeName: '' };
  };

  const storeOpenStatus = checkIfStoreOpen();

  // Show loading while cart is being loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show store closed message
  if (!storeOpenStatus.isOpen && items.length > 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-background border-b p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">Checkout</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">Loja Fechada</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            <strong>{storeOpenStatus.storeName}</strong> não está recebendo pedidos no momento. 
            Tente novamente no horário de funcionamento.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar à Loja
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmitDelivery = () => {
    if (deliveryType === "delivery") {
      if (!addressData.address || !addressData.number || !addressData.neighborhood) {
        toast.error("Preencha todos os campos obrigatórios do endereço");
        return;
      }
    }
    
    // Track InitiateCheckout event
    try {
      const allItems = items.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.promotional_price || item.product.price,
        quantity: item.quantity
      }));
      trackInitiateCheckout(allItems, subtotal);
    } catch (err) {
      console.error('[Analytics] Error tracking checkout:', err);
    }
    
    setStep("payment");
  };

  const handleSubmitPayment = async () => {
    setIsLoading(true);
    
    try {
      const estId = uniqueEstablishments[0];
      const estInfo = establishments.get(estId);
      const estItems = getEstablishmentItems(estId);
      const estSubtotal = getEstablishmentSubtotal(estId);
      const estDeliveryFee = deliveryType === 'delivery' ? (estInfo?.delivery_base_fee || 0) : 0;
      
      const paymentMethodMap: Record<string, 'pix' | 'cash' | 'credit_card' | 'debit_card'> = {
        'pix': 'pix',
        'cash': 'cash',
        'card': 'credit_card',
      };

      // For card payments via Checkout Pro, create order and redirect
      if (paymentMethod === 'card' && !isMultiStore) {
        const result = await createOrder({
          establishment_id: estId,
          delivery_type: deliveryType as 'delivery' | 'pickup',
          payment_method: 'credit_card',
          items: estItems.map(item => ({
            product_id: item.product.id,
            name: item.product.name,
            price: item.product.promotional_price || item.product.price,
            quantity: item.quantity,
            observation: item.observation,
          })),
          subtotal: estSubtotal,
          delivery_fee: estDeliveryFee,
          total: estSubtotal + estDeliveryFee - (appliedCoupon?.discountValue || 0),
          delivery_address: deliveryType === 'delivery' ? {
            cep: addressData.cep,
            address: addressData.address,
            number: addressData.number,
            complement: addressData.complement,
            neighborhood: addressData.neighborhood,
            reference: addressData.reference,
          } : undefined,
          observations: observations || undefined,
          whatsapp_tracking_enabled: whatsappTracking,
          customer_phone: whatsappTracking ? customerPhone.replace(/\D/g, '') : undefined,
        });

        if (result.success && result.order) {
          setCreatedOrderId(result.order.id);
          setCurrentEstablishmentId(estId);
          setStep("processing");
        } else {
          throw new Error('Falha ao criar pedido');
        }
        setIsLoading(false);
        return;
      }

      // For multi-store or cash payments, create all orders immediately
      if (isMultiStore || paymentMethod === 'cash') {
        const orderNumbers: string[] = [];
        
        for (const estId of uniqueEstablishments) {
          const estInfo = establishments.get(estId);
          const estItems = getEstablishmentItems(estId);
          const estSubtotal = getEstablishmentSubtotal(estId);
          const estDeliveryFee = deliveryType === 'delivery' ? (estInfo?.delivery_base_fee || 0) : 0;

          const result = await createOrder({
            establishment_id: estId,
            delivery_type: deliveryType as 'delivery' | 'pickup',
            payment_method: paymentMethodMap[paymentMethod] || 'pix',
            items: estItems.map(item => ({
              product_id: item.product.id,
              name: item.product.name,
              price: item.product.promotional_price || item.product.price,
              quantity: item.quantity,
              observation: item.observation,
            })),
            subtotal: estSubtotal,
            delivery_fee: estDeliveryFee,
            total: estSubtotal + estDeliveryFee - (appliedCoupon?.discountValue || 0),
            delivery_address: deliveryType === 'delivery' ? {
              cep: addressData.cep,
              address: addressData.address,
              number: addressData.number,
              complement: addressData.complement,
              neighborhood: addressData.neighborhood,
              reference: addressData.reference,
            } : undefined,
            change_for: paymentMethod === 'cash' && change ? parseFloat(change) : undefined,
            observations: observations || undefined,
            whatsapp_tracking_enabled: whatsappTracking,
            customer_phone: whatsappTracking ? customerPhone.replace(/\D/g, '') : undefined,
          });

          if (result.success && result.order) {
            orderNumbers.push(`${estInfo?.name}: #${result.orderNumber}`);
          } else {
            throw new Error(`Falha ao criar pedido para ${estInfo?.name}`);
          }
        }
        
        // Track Purchase events
        try {
          for (const estId of uniqueEstablishments) {
            const estItems = getEstablishmentItems(estId);
            const estSubtotal = getEstablishmentSubtotal(estId);
            trackPurchase({
              orderId: estId,
              total: estSubtotal,
              items: estItems.map(item => ({
                id: item.product.id,
                name: item.product.name,
                price: item.product.promotional_price || item.product.price,
                quantity: item.quantity
              }))
            });
          }
        } catch (err) {
          console.error('[Analytics] Error tracking purchase:', err);
        }
        
        setCompletedOrders(orderNumbers);
        clearCart();
        setStep("success");
        toast.success("Pedido realizado com sucesso!");
        setIsLoading(false);
        return;
      }

      // For single store with PIX, create order and show payment processor
      const result = await createOrder({
        establishment_id: estId,
        delivery_type: deliveryType as 'delivery' | 'pickup',
        payment_method: 'pix',
        items: estItems.map(item => ({
          product_id: item.product.id,
          name: item.product.name,
          price: item.product.promotional_price || item.product.price,
          quantity: item.quantity,
          observation: item.observation,
        })),
        subtotal: estSubtotal,
        delivery_fee: estDeliveryFee,
        total: estSubtotal + estDeliveryFee - (appliedCoupon?.discountValue || 0),
        delivery_address: deliveryType === 'delivery' ? {
          cep: addressData.cep,
          address: addressData.address,
          number: addressData.number,
          complement: addressData.complement,
          neighborhood: addressData.neighborhood,
          reference: addressData.reference,
        } : undefined,
        observations: observations || undefined,
        whatsapp_tracking_enabled: whatsappTracking,
        customer_phone: whatsappTracking ? customerPhone.replace(/\D/g, '') : undefined,
      });

      if (result.success && result.order) {
        setCreatedOrderId(result.order.id);
        setCurrentEstablishmentId(estId);
        setStep("processing");
      } else {
        throw new Error('Falha ao criar pedido');
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar pedido. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentComplete = () => {
    try {
      if (currentEstablishmentId && createdOrderId) {
        const estItems = getEstablishmentItems(currentEstablishmentId);
        trackPurchase({
          orderId: createdOrderId,
          total: total,
          items: estItems.map(item => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.promotional_price || item.product.price,
            quantity: item.quantity
          }))
        });
      }
    } catch (err) {
      console.error('[Analytics] Error tracking purchase:', err);
    }
    
    clearCart();
    const estInfo = currentEstablishmentId ? establishments.get(currentEstablishmentId) : null;
    setCompletedOrders([`${estInfo?.name || 'Loja'}: Pedido confirmado`]);
    setStep("success");
    toast.success("Pagamento confirmado! Pedido realizado com sucesso!");
  };

  const handlePaymentFailed = (error: string) => {
    toast.error(error || "Falha no pagamento. Tente novamente.");
    setStep("payment");
  };

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDeliveryFee = 0;

    uniqueEstablishments.forEach((estId) => {
      const estSubtotal = getEstablishmentSubtotal(estId);
      subtotal += estSubtotal;
      
      if (deliveryType === "delivery" || deliveryType === "turbo") {
        const estInfo = establishments.get(estId);
        const baseFee = estInfo?.delivery_base_fee || 0;
        totalDeliveryFee += deliveryType === "turbo" ? baseFee * 1.5 : baseFee;
      }
    });

    const platformFee = shouldApplyPlatformFee ? (subtotal * platformFeePercent) / 100 : 0;
    const discount = appliedCoupon?.discountValue || 0;
    
    return { 
      subtotal, 
      deliveryFee: totalDeliveryFee, 
      platformFee,
      discount,
      total: Math.max(0, subtotal + totalDeliveryFee + platformFee - discount)
    };
  };

  const { subtotal, deliveryFee, platformFee, discount, total } = calculateTotals();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Processing step - show payment processor (PIX or Card)
  if (step === "processing" && createdOrderId && currentEstablishmentId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep("payment")}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold">Pagamento</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-md space-y-4">
          {/* Card payment via Checkout Pro */}
          {paymentMethod === 'card' && (
            <CheckoutProPayment
              orderId={createdOrderId}
              establishmentId={currentEstablishmentId}
              amount={total}
              description={`Pedido #${createdOrderId.slice(-8)}`}
              items={items.map(item => ({
                id: item.product.id,
                title: item.product.name,
                description: item.product.name,
                category_id: 'food',
                quantity: item.quantity,
                unit_price: item.product.promotional_price || item.product.price,
                picture_url: item.product.image_url
              }))}
              payerEmail={user?.email}
              payerName={user?.user_metadata?.full_name}
              payerPhone={customerPhone.replace(/\D/g, '')}
              deliveryFee={deliveryFee}
              onPaymentComplete={(paymentId) => {
                console.log('Card payment completed:', paymentId);
                handlePaymentComplete();
              }}
              onPaymentFailed={(error) => {
                console.error('Card payment failed:', error);
                // Don't go back to payment, let user retry or choose PIX
              }}
            />
          )}

          {/* PIX payment via PaymentProcessor */}
          {paymentMethod === 'pix' && (
            <PaymentProcessor
              orderId={createdOrderId}
              establishmentId={currentEstablishmentId}
              amount={total}
              paymentMethod="pix"
              payerEmail={user?.email}
              payerName={user?.user_metadata?.full_name}
              onPaymentComplete={handlePaymentComplete}
              onPaymentFailed={handlePaymentFailed}
              onCancel={() => setStep("payment")}
            />
          )}
        </main>
      </div>
    );
  }

  // Success step
  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {completedOrders.length > 1 ? "Pedidos realizados!" : "Pedido realizado!"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {completedOrders.length > 1 
              ? "Seus pedidos foram enviados para os estabelecimentos"
              : "Seu pedido foi enviado para o estabelecimento"
            }
          </p>
          
          <Card className="mb-6 text-left">
            <CardContent className="p-4 space-y-3">
              {completedOrders.map((order, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <span>{order}</span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>Previsão: 30-45 min</span>
              </div>
              {deliveryType === "pickup" && (
                <div className="flex items-center gap-2 text-sm">
                  <Store className="w-4 h-4 text-primary" />
                  <span>Retirada no local</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total</span>
                <Price value={total} size="lg" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link to="/pedidos">Acompanhar pedidos</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/marketplace">Voltar ao início</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stepTitles: Record<CheckoutStep, string> = {
    cart: "Confirmar carrinho",
    delivery: "Entrega",
    payment: "Pagamento",
    processing: "Processando",
    success: "Sucesso"
  };

  const firstEstablishment = establishments.values().next().value;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (step === "payment") setStep("delivery");
                else if (step === "delivery") setStep("cart");
                else navigate(-1);
              }}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">{stepTitles[step]}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Multi-establishment warning */}
        {isMultiStore && (
          <Card className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Pedido em múltiplos estabelecimentos
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Você tem produtos de {uniqueEstablishments.length} estabelecimentos diferentes. 
                  Cada um processará seu pedido separadamente. Disponível apenas para retirada no local.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {["cart", "delivery", "payment"].map((s, idx) => {
            const isActive = step === s;
            const isPast = ["cart", "delivery", "payment"].indexOf(step) > idx;
            
            return (
              <div key={s} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${isActive ? "bg-primary text-primary-foreground" : ""}
                  ${isPast ? "bg-green-500 text-white" : ""}
                  ${!isActive && !isPast ? "bg-muted text-muted-foreground" : ""}
                `}>
                  {isPast ? "✓" : idx + 1}
                </div>
                {idx < 2 && (
                  <div className={`w-8 h-1 rounded mx-1 ${isPast ? "bg-green-500" : "bg-muted"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Cart Confirmation Step (NEW) */}
        {step === "cart" && (
          <CartConfirmationStep
            items={items}
            establishments={establishments}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
            onTemperatureChange={updateItemTemperature}
            onContinue={() => setStep("delivery")}
            subtotal={subtotal}
            freeDeliveryThreshold={50}
          />
        )}

        {/* Delivery Step */}
        {step === "delivery" && (
          <div className="space-y-6 animate-fade-up">
            <DeliveryOptionsCards
              selectedOption={deliveryType}
              onOptionChange={setDeliveryType}
              deliveryFee={firstEstablishment?.delivery_base_fee || 8}
              isMultiStore={isMultiStore}
              acceptsDelivery={firstEstablishment?.accepts_delivery}
              acceptsPickup={firstEstablishment?.accepts_pickup}
            />

            {/* Address Form */}
            {(deliveryType === "delivery" || deliveryType === "turbo") && !isMultiStore && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Endereço de entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAuthenticated && savedAddresses.length > 0 && !showAddressForm && (
                    <SavedAddressSelector
                      selectedId={selectedSavedAddressId}
                      onSelect={handleSelectSavedAddress}
                      onAddNew={handleAddNewAddress}
                    />
                  )}

                  {(!isAuthenticated || savedAddresses.length === 0 || showAddressForm) && (
                    <>
                      <SmartAddressInput
                        value={addressData}
                        onChange={setAddressData}
                        showMap={true}
                      />
                      
                      {isAuthenticated && addressData.address && addressData.number && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setSaveAddressDialogOpen(true)}
                        >
                          <Bookmark className="w-4 h-4 mr-2" />
                          Salvar este endereço
                        </Button>
                      )}

                      {isAuthenticated && savedAddresses.length > 0 && showAddressForm && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => setShowAddressForm(false)}
                        >
                          Usar endereço salvo
                        </Button>
                      )}

                      {!isAuthenticated && addressData.address && (
                        <p className="text-sm text-muted-foreground text-center">
                          <a href="/auth" className="text-primary hover:underline">Crie uma conta</a> para salvar seus endereços
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            <SaveAddressDialog
              open={saveAddressDialogOpen}
              onOpenChange={setSaveAddressDialogOpen}
              addressData={addressData}
              onSaved={() => setShowAddressForm(false)}
            />

            {/* Pickup locations for multi-establishment */}
            {deliveryType === "pickup" && isMultiStore && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Locais de retirada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {uniqueEstablishments.map((estId) => {
                    const estInfo = establishments.get(estId);
                    return (
                      <div key={estId} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {estInfo?.logo_url && (
                            <img 
                              src={estInfo.logo_url} 
                              alt={estInfo.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{estInfo?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {getEstablishmentItems(estId).length} itens • R$ {getEstablishmentSubtotal(estId).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Button onClick={handleSubmitDelivery} className="w-full h-12 text-base font-semibold">
              Continuar para pagamento
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Payment Step */}
        {step === "payment" && (
          <div className="space-y-6 animate-fade-up">
            {/* 1. Products Summary - TOP */}
            <CheckoutSummary
              itemsCount={totalItems}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              platformFee={platformFee}
              discount={discount}
              couponCode={appliedCoupon?.code}
              total={total}
            />

            {/* 2. Observations */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Textarea
                    placeholder="Alguma observação para o pedido?"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value.slice(0, 150))}
                    className="resize-none"
                    rows={3}
                  />
                  <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {observations.length}/150
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 3. Coupon Input */}
            {firstEstablishment && (
              <CouponInput
                establishmentId={firstEstablishment.id}
                subtotal={subtotal}
                onCouponApplied={setAppliedCoupon}
                onCouponRemoved={() => setAppliedCoupon(null)}
                appliedCoupon={appliedCoupon}
              />
            )}

            {/* 4. Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Forma de pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Gateway Selector - only shows if multiple gateways available */}
                {firstEstablishment && (
                  <div className="mb-4">
                    <GatewaySelector
                      establishmentId={firstEstablishment.id}
                      selectedGateway={selectedGateway}
                      onGatewayChange={setSelectedGateway}
                    />
                  </div>
                )}

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex items-center gap-3 cursor-pointer flex-1">
                      <QrCode className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">PIX</p>
                        <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
                      </div>
                    </Label>
                  </div>
                  
                  {!isMultiStore && (
                    <>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer mt-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                          <CreditCard className="w-5 h-5 text-primary" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">Cartão de Crédito/Débito</p>
                              <Badge variant="secondary" className="text-xs">Checkout Seguro</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Via Mercado Pago</p>
                          </div>
                        </Label>
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer mt-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Banknote className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Dinheiro</p>
                        <p className="text-sm text-muted-foreground">Na entrega/retirada</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "cash" && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="change">Troco para quanto?</Label>
                    <Input
                      id="change"
                      placeholder="Ex: 100.00"
                      value={change}
                      onChange={(e) => setChange(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 5. WhatsApp Tracking */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="whatsapp-tracking"
                    checked={whatsappTracking}
                    onCheckedChange={(checked) => setWhatsappTracking(checked === true)}
                  />
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="whatsapp-tracking" className="font-medium cursor-pointer flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      Acompanhar pelo WhatsApp
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receba atualizações sobre seu pedido
                    </p>
                    {/* Show pre-filled phone if from profile */}
                    {whatsappTracking && customerPhone && user?.id && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <CheckCircle className="w-3 h-3" />
                        Notificações para: {customerPhone}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Only show input if user is not logged in OR has no phone in profile */}
                {whatsappTracking && (!user?.id || !customerPhone) && (
                  <div className="mt-3 pt-3 border-t">
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Informe seu WhatsApp para receber atualizações
                    </Label>
                    <Input
                      placeholder="(99) 99999-9999"
                      value={customerPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 11) {
                          let formatted = value;
                          if (value.length > 2) {
                            formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                          }
                          if (value.length > 7) {
                            formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
                          }
                          setCustomerPhone(formatted);
                        }
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 6. Total Final with Price */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total do pedido</span>
                  <Price value={total} size="xl" className="text-primary font-bold" />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmitPayment} 
              className="w-full h-14 text-base font-bold"
              disabled={isLoading || creatingOrder}
            >
              {isLoading || creatingOrder ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  FAZER PEDIDO
                  <Price value={total} className="text-primary-foreground" />
                </span>
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Checkout;
