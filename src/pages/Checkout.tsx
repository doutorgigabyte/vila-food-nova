import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  Utensils
} from "lucide-react";
import { toast } from "sonner";

// Mock cart data
const cartItems = [
  {
    id: 1,
    name: "Pizza Margherita",
    quantity: 2,
    price: 45.90,
    observation: "Sem cebola",
  },
  {
    id: 2,
    name: "Refrigerante 2L",
    quantity: 1,
    price: 12.90,
    observation: "",
  },
];

const deliveryFee = 5.99;

const Checkout = () => {
  const [step, setStep] = useState<"delivery" | "payment" | "success">("delivery");
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [isLoading, setIsLoading] = useState(false);
  
  // Address form
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [reference, setReference] = useState("");
  
  // Payment
  const [change, setChange] = useState("");
  const [observations, setObservations] = useState("");

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = deliveryType === "delivery" ? subtotal + deliveryFee : subtotal;

  const fetchCep = async (cepValue: string) => {
    if (cepValue.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setAddress(data.logradouro || "");
          setNeighborhood(data.bairro || "");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const handleSubmitDelivery = () => {
    if (deliveryType === "delivery") {
      if (!cep || !address || !number || !neighborhood) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
    }
    setStep("payment");
  };

  const handleSubmitPayment = async () => {
    setIsLoading(true);
    // Simulate order submission
    setTimeout(() => {
      setIsLoading(false);
      setStep("success");
    }, 2000);
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Pedido realizado!</h1>
          <p className="text-muted-foreground mb-6">
            Seu pedido #1234 foi enviado para o estabelecimento
          </p>
          
          <Card className="mb-6 text-left">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>Previsão de entrega: 30-45 min</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{address}, {number} - {neighborhood}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total pago</span>
                <span className="font-bold">R$ {total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link to="/pedidos">Acompanhar pedido</Link>
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
            <Link 
              to={step === "delivery" ? "/loja/pizza-do-bairro" : "#"}
              onClick={(e) => {
                if (step === "payment") {
                  e.preventDefault();
                  setStep("delivery");
                }
              }}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">Finalizar pedido</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
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
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer mt-2">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Store className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Retirada no local</p>
                        <p className="text-sm text-muted-foreground">Retire na loja</p>
                      </div>
                    </Label>
                    <span className="text-sm text-green-600 font-medium">Grátis</span>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Address Form */}
            {deliveryType === "delivery" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Endereço de entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setCep(value);
                        fetchCep(value);
                      }}
                      maxLength={8}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="address">Endereço *</Label>
                      <Input
                        id="address"
                        placeholder="Rua, Avenida..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        placeholder="123"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      placeholder="Apto, Bloco..."
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      placeholder="Bairro"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Ponto de referência</Label>
                    <Input
                      id="reference"
                      placeholder="Próximo a..."
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
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
              </CardHeader>
              <CardContent>
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
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer mt-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Banknote className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Dinheiro</p>
                        <p className="text-sm text-muted-foreground">Na entrega</p>
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
              <CardContent className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {deliveryType === "delivery" && (
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
