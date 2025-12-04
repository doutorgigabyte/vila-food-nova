import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Printer,
  X,
  Check,
  Receipt,
  Users,
  Calculator
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

const PDV = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Order settings
  const [orderType, setOrderType] = useState<'takeaway' | 'delivery' | 'table'>('takeaway');
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'credit_card' | 'debit_card'>('cash');
  const [observations, setObservations] = useState("");
  const [discount, setDiscount] = useState(0);
  const [changeFor, setChangeFor] = useState<number | null>(null);
  
  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);

  // Mock establishment ID - in production, get from auth context
  const establishmentId = "00000000-0000-0000-0000-000000000000";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name, image_url')
        .eq('is_active', true)
        .order('sort_order');

      setCategories(catData || []);

      // Fetch products
      const { data: prodData } = await supabase
        .from('products')
        .select('id, name, description, price, promotional_price, image_url, category_id')
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

  const addToCart = (product: Product) => {
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
    toast.success(`${product.name} adicionado`);
  };

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
    setObservations("");
    setCustomerName("");
    setCustomerPhone("");
    setTableNumber("");
    setChangeFor(null);
  };

  const subtotal = cart.reduce((sum, item) => {
    const price = item.promotional_price || item.price;
    return sum + (price * item.quantity);
  }, 0);

  const total = subtotal - discount;

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
            <p>VilaFood Delivery</p>
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

  const processOrder = async () => {
    if (cart.length === 0) {
      toast.error('Adicione itens ao carrinho');
      return;
    }

    setProcessingOrder(true);

    try {
      // Create order
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
          establishment_id: establishmentId,
          status: 'confirmed',
          delivery_type: orderType === 'table' ? 'table' : orderType === 'delivery' ? 'delivery' : 'pickup',
          payment_method: paymentMethod,
          items: orderItems,
          subtotal: subtotal,
          discount: discount,
          delivery_fee: 0,
          total: total,
          table_number: orderType === 'table' ? tableNumber : null,
          observations: observations || null,
          change_for: changeFor
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

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link to="/painel">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">PDV - Ponto de Venda</h1>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {/* Categories */}
        <div className="bg-card border-b border-border p-4 overflow-x-auto">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted" />
                  <CardContent className="p-3">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-5 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(product => (
                <Card 
                  key={product.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => addToCart(product)}
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🍽️
                      </div>
                    )}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                      <Plus className="w-8 h-8 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {product.promotional_price ? (
                        <>
                          <span className="text-xs text-muted-foreground line-through">
                            R$ {product.price.toFixed(2)}
                          </span>
                          <span className="font-bold text-primary">
                            R$ {product.promotional_price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-primary">
                          R$ {product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-full lg:w-96 bg-card border-l border-border flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrinho
            </h2>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <Trash2 className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {/* Order Type */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={orderType === 'takeaway' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderType('takeaway')}
              className="text-xs"
            >
              Retirada
            </Button>
            <Button
              variant={orderType === 'delivery' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderType('delivery')}
              className="text-xs"
            >
              Delivery
            </Button>
            <Button
              variant={orderType === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderType('table')}
              className="text-xs"
            >
              Mesa
            </Button>
          </div>

          {orderType === 'table' && (
            <Input
              placeholder="Número da mesa"
              className="mt-2"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
            />
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Carrinho vazio</p>
              <p className="text-sm text-muted-foreground">Clique nos produtos para adicionar</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                  <p className="text-primary font-bold">
                    R$ {((item.promotional_price || item.price) * item.quantity).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-7 h-7"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-7 h-7"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-destructive ml-auto"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className="border-t border-border p-4 space-y-3">
          {/* Customer */}
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setShowCustomerModal(true)}
          >
            <User className="w-4 h-4 mr-2" />
            {customerName || 'Selecionar Cliente'}
          </Button>

          {/* Discount */}
          <div className="flex items-center gap-2">
            <Label className="text-sm">Desconto:</Label>
            <Input
              type="number"
              min="0"
              className="w-24"
              value={discount || ''}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              placeholder="R$ 0,00"
            />
          </div>

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto:</span>
                <span>-R$ {discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Button */}
          <Button 
            className="w-full h-12 text-lg" 
            disabled={cart.length === 0}
            onClick={() => setShowPaymentModal(true)}
          >
            <Receipt className="w-5 h-5 mr-2" />
            Finalizar Venda
          </Button>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
            <DialogDescription>
              Total: <span className="font-bold text-foreground text-xl">R$ {total.toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Payment Method */}
            <div>
              <Label className="mb-2 block">Forma de Pagamento</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted"
                       onClick={() => setPaymentMethod('cash')}>
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="cursor-pointer flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Dinheiro
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted"
                       onClick={() => setPaymentMethod('pix')}>
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="cursor-pointer flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      PIX
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted"
                       onClick={() => setPaymentMethod('credit_card')}>
                    <RadioGroupItem value="credit_card" id="credit_card" />
                    <Label htmlFor="credit_card" className="cursor-pointer flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Crédito
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted"
                       onClick={() => setPaymentMethod('debit_card')}>
                    <RadioGroupItem value="debit_card" id="debit_card" />
                    <Label htmlFor="debit_card" className="cursor-pointer flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Débito
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Change For (if cash) */}
            {paymentMethod === 'cash' && (
              <div>
                <Label className="mb-2 block">Troco para</Label>
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={changeFor || ''}
                  onChange={(e) => setChangeFor(parseFloat(e.target.value) || null)}
                />
                {changeFor && changeFor > total && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Troco: R$ {(changeFor - total).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {/* Observations */}
            <div>
              <Label className="mb-2 block">Observações</Label>
              <Textarea
                placeholder="Observações do pedido..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancelar
            </Button>
            <Button onClick={processOrder} disabled={processingOrder}>
              {processingOrder ? (
                <>Processando...</>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Venda
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
};

export default PDV;
