import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  MapPin, 
  Phone, 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  X,
  Info,
  Bike,
  CreditCard,
  Banknote,
  QrCode,
  Utensils
} from "lucide-react";

// Mock establishment data
const establishmentData = {
  id: 1,
  name: "Pizza do Bairro",
  slug: "pizza-do-bairro",
  description: "As melhores pizzas artesanais da região. Massa crocante, ingredientes selecionados e muito sabor em cada fatia.",
  segment: "Pizzaria",
  rating: 4.8,
  reviews: 324,
  deliveryTime: "30-45 min",
  deliveryFee: 5.99,
  minOrder: 25,
  address: "Rua das Pizzas, 123 - Centro",
  phone: "(11) 99999-9999",
  isOpen: true,
  banner: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200",
  logo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200",
  paymentMethods: ["pix", "credit", "debit", "cash"],
  workingHours: "Seg-Dom: 18:00 - 23:00",
};

const categories = [
  { id: "promocoes", name: "Promoções", count: 3 },
  { id: "pizzas-salgadas", name: "Pizzas Salgadas", count: 12 },
  { id: "pizzas-doces", name: "Pizzas Doces", count: 5 },
  { id: "bebidas", name: "Bebidas", count: 8 },
  { id: "sobremesas", name: "Sobremesas", count: 4 },
];

const products = [
  {
    id: 1,
    name: "Pizza Margherita",
    description: "Molho de tomate, mussarela, tomate fresco e manjericão",
    price: 45.90,
    originalPrice: 52.90,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300",
    category: "pizzas-salgadas",
    isPromo: true,
  },
  {
    id: 2,
    name: "Pizza Calabresa",
    description: "Molho de tomate, mussarela e calabresa fatiada",
    price: 42.90,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300",
    category: "pizzas-salgadas",
    isPromo: false,
  },
  {
    id: 3,
    name: "Pizza Portuguesa",
    description: "Molho de tomate, mussarela, presunto, ovos, cebola, azeitona e ervilha",
    price: 48.90,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300",
    category: "pizzas-salgadas",
    isPromo: false,
  },
  {
    id: 4,
    name: "Pizza Quatro Queijos",
    description: "Molho de tomate, mussarela, parmesão, gorgonzola e catupiry",
    price: 52.90,
    originalPrice: 58.90,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300",
    category: "pizzas-salgadas",
    isPromo: true,
  },
  {
    id: 5,
    name: "Pizza de Chocolate",
    description: "Chocolate ao leite com granulado",
    price: 38.90,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=300",
    category: "pizzas-doces",
    isPromo: false,
  },
  {
    id: 6,
    name: "Refrigerante 2L",
    description: "Coca-Cola, Guaraná ou Fanta",
    price: 12.90,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300",
    category: "bebidas",
    isPromo: false,
  },
];

interface CartItem {
  product: typeof products[0];
  quantity: number;
  observation: string;
}

const Store = () => {
  const { slug } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productObservation, setProductObservation] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const establishment = establishmentData;

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = () => {
    if (!selectedProduct) return;
    
    const existingItem = cart.find(item => item.product.id === selectedProduct.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === selectedProduct.id 
          ? { ...item, quantity: item.quantity + productQuantity }
          : item
      ));
    } else {
      setCart([...cart, { 
        product: selectedProduct, 
        quantity: productQuantity, 
        observation: productObservation 
      }]);
    }
    
    setSelectedProduct(null);
    setProductQuantity(1);
    setProductObservation("");
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-48 md:h-64">
        <img
          src={establishment.banner}
          alt={establishment.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Back button */}
        <Link 
          to="/marketplace" 
          className="absolute top-4 left-4 p-2 bg-background/90 rounded-full hover:bg-background transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Info button */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="absolute top-4 right-4 p-2 bg-background/90 rounded-full hover:bg-background transition-colors">
              <Info className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Informações</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Horário de funcionamento</p>
                  <p className="text-sm text-muted-foreground">{establishment.workingHours}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Endereço</p>
                  <p className="text-sm text-muted-foreground">{establishment.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Telefone</p>
                  <p className="text-sm text-muted-foreground">{establishment.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Bike className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Entrega</p>
                  <p className="text-sm text-muted-foreground">
                    {establishment.deliveryTime} • Taxa: R$ {establishment.deliveryFee.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pedido mínimo: R$ {establishment.minOrder.toFixed(2)}
                  </p>
                </div>
              </div>
              <div>
                <p className="font-medium mb-2">Formas de pagamento</p>
                <div className="flex flex-wrap gap-2">
                  {establishment.paymentMethods.includes("pix") && (
                    <Badge variant="outline" className="gap-1">
                      <QrCode className="w-3 h-3" /> PIX
                    </Badge>
                  )}
                  {establishment.paymentMethods.includes("credit") && (
                    <Badge variant="outline" className="gap-1">
                      <CreditCard className="w-3 h-3" /> Crédito
                    </Badge>
                  )}
                  {establishment.paymentMethods.includes("debit") && (
                    <Badge variant="outline" className="gap-1">
                      <CreditCard className="w-3 h-3" /> Débito
                    </Badge>
                  )}
                  {establishment.paymentMethods.includes("cash") && (
                    <Badge variant="outline" className="gap-1">
                      <Banknote className="w-3 h-3" /> Dinheiro
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Store Info */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-card rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-start gap-4">
            <img
              src={establishment.logo}
              alt={establishment.name}
              className="w-20 h-20 rounded-xl object-cover border-4 border-background"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{establishment.name}</h1>
                {establishment.isOpen ? (
                  <Badge className="bg-green-500">Aberto</Badge>
                ) : (
                  <Badge variant="secondary">Fechado</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{establishment.segment}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{establishment.rating}</span>
                  <span className="text-muted-foreground">({establishment.reviews})</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{establishment.deliveryTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar no cardápio..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="pb-24">
          {categories.map((category) => {
            const categoryProducts = filteredProducts.filter(p => p.category === category.id);
            if (categoryProducts.length === 0) return null;
            
            return (
              <div key={category.id} className="mb-8">
                <h2 className="text-lg font-bold mb-4">{category.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryProducts.map((product) => (
                    <Card 
                      key={product.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedProduct(product);
                        setProductQuantity(1);
                        setProductObservation("");
                      }}
                    >
                      <CardContent className="p-4 flex gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <h3 className="font-medium">{product.name}</h3>
                            {product.isPromo && (
                              <Badge variant="destructive" className="text-xs">Promo</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {product.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-bold text-primary">
                              R$ {product.price.toFixed(2)}
                            </span>
                            {product.originalPrice && (
                              <span className="text-sm text-muted-foreground line-through">
                                R$ {product.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Product Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-lg">
          {selectedProduct && (
            <>
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-48 object-cover rounded-lg -mt-6 mx-0"
              />
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground">{selectedProduct.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary">
                  R$ {selectedProduct.price.toFixed(2)}
                </span>
                {selectedProduct.originalPrice && (
                  <span className="text-muted-foreground line-through">
                    R$ {selectedProduct.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Observações</label>
                  <Textarea
                    placeholder="Ex: Sem cebola, bem passado..."
                    value={productObservation}
                    onChange={(e) => setProductObservation(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-lg font-medium w-8 text-center">{productQuantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setProductQuantity(productQuantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button onClick={addToCart} className="gap-2">
                    Adicionar R$ {(selectedProduct.price * productQuantity).toFixed(2)}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border">
          <div className="container mx-auto">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button className="w-full gap-3" size="lg">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="flex-1 text-left">Ver sacola ({cartItemsCount} {cartItemsCount === 1 ? "item" : "itens"})</span>
                  <span className="font-bold">R$ {cartTotal.toFixed(2)}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] flex flex-col">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Sua sacola
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{item.product.name}</h4>
                        {item.observation && (
                          <p className="text-xs text-muted-foreground">Obs: {item.observation}</p>
                        )}
                        <p className="text-primary font-medium mt-1">
                          R$ {(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCartQuantity(item.product.id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCartQuantity(item.product.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span>R$ {establishment.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R$ {(cartTotal + establishment.deliveryFee).toFixed(2)}</span>
                  </div>
                  
                  <Link to="/checkout">
                    <Button className="w-full" size="lg">
                      Finalizar pedido
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}
    </div>
  );
};

export default Store;
