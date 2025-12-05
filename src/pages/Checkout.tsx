import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Banknote, 
  QrCode,
  Bike,
  Store,
  Clock,
  CheckCircle,
  ShoppingBag,
  AlertTriangle,
  Bookmark
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { useCreateOrder } from "@/hooks/useCreateOrder";
import { useAuth } from "@/hooks/useAuth";
import { useSavedAddresses, SavedAddress } from "@/hooks/useSavedAddresses";
import AddressAutocomplete from "@/components/checkout/AddressAutocomplete";
import { SavedAddressSelector } from "@/components/checkout/SavedAddressSelector";
import { SaveAddressDialog } from "@/components/checkout/SaveAddressDialog";
import { PaymentProcessor } from "@/components/checkout/PaymentProcessor";

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
    clearEstablishmentCart,
    clearCart
  } = useCart();

  const { createOrder, loading: creatingOrder } = useCreateOrder();

  const [step, setStep] = useState<"delivery" | "payment" | "processing" | "success">("delivery");
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [currentEstablishmentId, setCurrentEstablishmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<string[]>([]);
  
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
    lat: undefined,
    lng: undefined,
    formatted_address: "",
  });
  
  // Payment
  const [change, setChange] = useState("");
  const [observations, setObservations] = useState("");
  
  // Saved addresses
  const { user } = useAuth();
  const { addresses: savedAddresses, isAuthenticated, getDefaultAddress } = useSavedAddresses();
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | undefined>();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saveAddressDialogOpen, setSaveAddressDialogOpen] = useState(false);

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
      lat: undefined,
      lng: undefined,
      formatted_address: "",
    });
  };

  const uniqueEstablishments = getUniqueEstablishments();
  const isMultiStore = isMultiEstablishment();

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

  // Show loading while cart is being loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const fetchCep = async (cepValue: string) => {
    if (cepValue.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setAddressData(prev => ({
            ...prev,
            address: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || "",
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const handleSubmitDelivery = () => {
    if (deliveryType === "delivery") {
      if (!addressData.address || !addressData.number || !addressData.neighborhood) {
        toast.error("Preencha todos os campos obrigatórios do endereço");
        return;
      }
    }
    setStep("payment");
  };

  const handleSubmitPayment = async () => {
    setIsLoading(true);
    
    try {
      // For single establishment orders with online payment (PIX), create order first
      const estId = uniqueEstablishments[0];
      const estInfo = establishments.get(estId);
      const estItems = getEstablishmentItems(estId);
      const estSubtotal = getEstablishmentSubtotal(estId);
      const estDeliveryFee = deliveryType === 'delivery' ? (estInfo?.delivery_base_fee || 0) : 0;
      
      // Map payment method to database enum
      const paymentMethodMap: Record<string, 'pix' | 'cash' | 'credit_card' | 'debit_card'> = {
        'pix': 'pix',
        'cash': 'cash',
        'credit': 'credit_card',
        'debit': 'debit_card',
      };

      // For multi-store or if PIX, create all orders
      if (isMultiStore || paymentMethod !== 'pix') {
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
            total: estSubtotal + estDeliveryFee,
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
          });

          if (result.success && result.order) {
            orderNumbers.push(`${estInfo?.name}: #${result.orderNumber}`);
          } else {
            throw new Error(`Falha ao criar pedido para ${estInfo?.name}`);
          }
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
        total: estSubtotal + estDeliveryFee,
        delivery_address: deliveryType === 'delivery' ? {
          cep: addressData.cep,
          address: addressData.address,
          number: addressData.number,
          complement: addressData.complement,
          neighborhood: addressData.neighborhood,
          reference: addressData.reference,
        } : undefined,
        observations: observations || undefined,
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
      
      if (deliveryType === "delivery") {
        const estInfo = establishments.get(estId);
        totalDeliveryFee += estInfo?.delivery_base_fee || 0;
      }
    });

    return { subtotal, deliveryFee: totalDeliveryFee, total: subtotal + totalDeliveryFee };
  };

  const { subtotal, deliveryFee, total } = calculateTotals();

  // Processing step - show payment processor
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
        <main className="container mx-auto px-4 py-6 max-w-md">
          <PaymentProcessor
            orderId={createdOrderId}
            establishmentId={currentEstablishmentId}
            amount={total}
            paymentMethod={paymentMethod as 'pix' | 'credit' | 'debit' | 'cash'}
            payerEmail={user?.email}
            payerName={user?.user_metadata?.full_name}
            onPaymentComplete={handlePaymentComplete}
            onPaymentFailed={handlePaymentFailed}
            onCancel={() => setStep("payment")}
          />
        </main>
      </div>
    );
  }

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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">R$ {total.toFixed(2)}</span>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (step === "payment") {
                  setStep("delivery");
                } else {
                  navigate(-1);
                }
              }}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">Finalizar pedido</h1>
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

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`flex items-center gap-2 ${step === "delivery" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "delivery" ? "bg-primary text-primary-foreground" : "bg-green-500 text-white"
            }`}>
              {step === "delivery" ? "1" : "✓"}
            </div>
            <span className="text-sm font-medium">Entrega</span>
          </div>
          <div className={`w-12 h-1 rounded ${step === "payment" ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex items-center gap-2 ${step === "payment" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === "payment" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Pagamento</span>
          </div>
        </div>

        {/* Delivery Step */}
        {step === "delivery" && (
          <div className="space-y-6 animate-fade-up">
            {/* Delivery Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como deseja receber?</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
                  {!isMultiStore && (
                    <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery" className="flex items-center gap-3 cursor-pointer flex-1">
                        <Bike className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Delivery</p>
                          <p className="text-sm text-muted-foreground">Receba no seu endereço</p>
                        </div>
                      </Label>
                      <span className="text-sm text-muted-foreground">R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className={`flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer ${!isMultiStore ? 'mt-2' : ''}`}>
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Store className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Retirada no local</p>
                        <p className="text-sm text-muted-foreground">
                          {isMultiStore 
                            ? `Retire em ${uniqueEstablishments.length} estabelecimentos`
                            : "Retire na loja"
                          }
                        </p>
                      </div>
                    </Label>
                    <span className="text-sm text-green-600 font-medium">Grátis</span>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Address Form */}
            {deliveryType === "delivery" && !isMultiStore && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Endereço de entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Saved Addresses - only show if user has saved addresses and not showing form */}
                  {isAuthenticated && savedAddresses.length > 0 && !showAddressForm && (
                    <SavedAddressSelector
                      selectedId={selectedSavedAddressId}
                      onSelect={handleSelectSavedAddress}
                      onAddNew={handleAddNewAddress}
                    />
                  )}

                  {/* Address Autocomplete - show if no saved addresses OR user clicked "add new" */}
                  {(!isAuthenticated || savedAddresses.length === 0 || showAddressForm) && (
                    <>
                      <AddressAutocomplete
                        value={addressData}
                        onChange={setAddressData}
                      />
                      
                      {/* Option to save address for authenticated users */}
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

                      {/* Option to use saved address if user has some */}
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

                      {/* Prompt to create account for guest users */}
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

            {/* Save Address Dialog */}
            <SaveAddressDialog
              open={saveAddressDialogOpen}
              onOpenChange={setSaveAddressDialogOpen}
              addressData={addressData}
              onSaved={() => {
                setShowAddressForm(false);
              }}
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

            <Button onClick={handleSubmitDelivery} className="w-full" size="lg">
              Continuar para pagamento
            </Button>
          </div>
        )}

        {/* Payment Step */}
        {step === "payment" && (
          <div className="space-y-6 animate-fade-up">
            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Forma de pagamento</CardTitle>
                {isMultiStore && (
                  <p className="text-sm text-muted-foreground">
                    O pagamento será feito separadamente em cada estabelecimento na retirada
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex items-center gap-3 cursor-pointer flex-1">
                      <QrCode className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">PIX</p>
                        <p className="text-sm text-muted-foreground">
                          {isMultiStore ? "Pague na retirada via PIX" : "Pagamento instantâneo"}
                        </p>
                      </div>
                    </Label>
                  </div>
                  {!isMultiStore && (
                    <>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer mt-2">
                        <RadioGroupItem value="credit" id="credit" />
                        <Label htmlFor="credit" className="flex items-center gap-3 cursor-pointer flex-1">
                          <CreditCard className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">Cartão de crédito</p>
                            <p className="text-sm text-muted-foreground">Na entrega</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer mt-2">
                        <RadioGroupItem value="debit" id="debit" />
                        <Label htmlFor="debit" className="flex items-center gap-3 cursor-pointer flex-1">
                          <CreditCard className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">Cartão de débito</p>
                            <p className="text-sm text-muted-foreground">Na entrega</p>
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
                        <p className="text-sm text-muted-foreground">
                          {isMultiStore ? "Pague na retirada" : "Na entrega"}
                        </p>
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

            {/* Observations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Alguma observação para o pedido?"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo do pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {uniqueEstablishments.map((estId) => {
                  const estInfo = establishments.get(estId);
                  const estItems = getEstablishmentItems(estId);
                  const estSubtotal = getEstablishmentSubtotal(estId);
                  
                  return (
                    <div key={estId} className="space-y-3">
                      {isMultiStore && (
                        <div className="flex items-center gap-2">
                          {estInfo?.logo_url && (
                            <img 
                              src={estInfo.logo_url} 
                              alt={estInfo.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          <span className="font-medium">{estInfo?.name}</span>
                        </div>
                      )}
                      {estItems.map((item) => (
                        <div key={item.product.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.product.name}</span>
                          <span>R$ {((item.product.promotional_price || item.product.price) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {isMultiStore && (
                        <>
                          <div className="flex justify-between text-sm font-medium">
                            <span>Subtotal {estInfo?.name}</span>
                            <span>R$ {estSubtotal.toFixed(2)}</span>
                          </div>
                          <Separator />
                        </>
                      )}
                    </div>
                  );
                })}
                
                {!isMultiStore && <Separator />}
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {deliveryType === "delivery" && deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span>R$ {deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleSubmitPayment} 
              className="w-full" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Processando..." : `Finalizar pedido • R$ ${total.toFixed(2)}`}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Checkout;
