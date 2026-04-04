import { useState, useEffect } from "react";
import { Search, ShoppingCart, Plus, Star, QrCode } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  rating: number;
}

interface Category {
  id: string;
  name: string;
  emoji: string;
  products: Product[];
}

const MOCK_MENU: Category[] = [
  {
    id: "pizzas",
    name: "Pizzas",
    emoji: "🍕",
    products: [
      { id: "1", name: "Margherita", description: "Molho, mussarela, manjericão", price: 45, emoji: "🍕", rating: 4.8 },
      { id: "2", name: "Pepperoni", description: "Molho, mussarela, pepperoni", price: 52, emoji: "🍕", rating: 4.9 },
    ],
  },
  {
    id: "burgers",
    name: "Hambúrgueres",
    emoji: "🍔",
    products: [
      { id: "3", name: "Smash Duplo", description: "2x blend, cheddar, bacon", price: 38, emoji: "🍔", rating: 4.7 },
      { id: "4", name: "Classic", description: "Blend, queijo, salada", price: 28, emoji: "🍔", rating: 4.5 },
    ],
  },
  {
    id: "drinks",
    name: "Bebidas",
    emoji: "🥤",
    products: [
      { id: "5", name: "Coca-Cola 2L", description: "Refrigerante", price: 12, emoji: "🥤", rating: 4.9 },
      { id: "6", name: "Suco Natural", description: "Laranja ou Limão", price: 10, emoji: "🧃", rating: 4.6 },
    ],
  },
];

const MenuSimulation = () => {
  const [activeCategory, setActiveCategory] = useState(MOCK_MENU[0].id);
  const [cartCount, setCartCount] = useState(0);
  const [showQR, setShowQR] = useState(true);

  const currentCategory = MOCK_MENU.find((c) => c.id === activeCategory) || MOCK_MENU[0];

  // Auto cycle categories
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCategory((prev) => {
        const currentIndex = MOCK_MENU.findIndex((c) => c.id === prev);
        return MOCK_MENU[(currentIndex + 1) % MOCK_MENU.length].id;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Auto add to cart
  useEffect(() => {
    const interval = setInterval(() => {
      setCartCount((prev) => (prev + 1) % 6);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Toggle QR code view
  useEffect(() => {
    const interval = setInterval(() => {
      setShowQR((prev) => !prev);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Store header */}
      <div className="relative h-24 bg-gradient-to-br from-primary/80 to-accent/80">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end gap-3">
          <div className="w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center -mb-3">
            <span className="text-3xl">🍕</span>
          </div>
          <div className="flex-1 pb-1">
            <h3 className="text-white font-bold text-sm">Pizzaria do Mário</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-white text-xs">4.8</span>
              </div>
              <span className="text-white/50 text-xs">• 25-40 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-3 py-3 bg-zinc-950">
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
          <Search className="w-4 h-4 text-white/40" />
          <span className="text-white/40 text-xs">Buscar no cardápio...</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="px-3 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {MOCK_MENU.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-zinc-800 text-white/70"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-20">
        {showQR ? (
          // QR Code view
          <div className="flex flex-col items-center justify-center py-6 animate-fade-up">
            <div className="p-4 bg-white rounded-2xl mb-3">
              <div className="w-28 h-28 grid grid-cols-7 gap-0.5">
                {[...Array(49)].map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square ${Math.random() > 0.4 ? "bg-black" : "bg-white"}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="w-4 h-4 text-primary" />
              <span className="text-white font-medium text-sm">Escaneie o QR Code</span>
            </div>
            <p className="text-primary text-xs font-medium">pizzaria.vilafood.delivery</p>
            <p className="text-white/40 text-[10px] mt-1">Ou acesse pelo link direto</p>
          </div>
        ) : (
          // Products list
          currentCategory.products.map((product) => (
            <div
              key={product.id}
              className="flex gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800 animate-fade-up"
            >
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-orange-400/20 to-red-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-4xl">{product.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-white font-medium text-sm">{product.name}</h4>
                    <p className="text-white/50 text-xs line-clamp-2">{product.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-white/70 text-xs">{product.rating}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-sm">
                      R$ {product.price.toFixed(2)}
                    </span>
                    <button className="p-1.5 bg-primary rounded-lg">
                      <Plus className="w-3.5 h-3.5 text-primary-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart button */}
      {cartCount > 0 && (
        <div className="absolute bottom-4 left-3 right-3 animate-fade-up">
          <button className="w-full flex items-center justify-between px-4 py-3 bg-primary rounded-xl">
            <div className="flex items-center gap-2">
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-primary-foreground" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-primary text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <span className="text-primary-foreground font-medium text-sm">Ver carrinho</span>
            </div>
            <span className="text-primary-foreground font-bold text-sm">R$ {(cartCount * 35).toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuSimulation;
