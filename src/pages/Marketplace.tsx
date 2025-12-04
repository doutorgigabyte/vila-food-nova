import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  Filter,
  Utensils,
  Pizza,
  Coffee,
  Sandwich,
  IceCream,
  Cake,
  ShoppingBag,
  X,
  ChevronDown,
  User
} from "lucide-react";

// Mock data for establishments
const establishments = [
  {
    id: 1,
    name: "Pizza do Bairro",
    slug: "pizza-do-bairro",
    segment: "Pizzaria",
    rating: 4.8,
    reviews: 324,
    deliveryTime: "30-45 min",
    deliveryFee: 5.99,
    minOrder: 25,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
    logo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100",
    isOpen: true,
    isFeatured: true,
  },
  {
    id: 2,
    name: "Burger House",
    slug: "burger-house",
    segment: "Hamburgueria",
    rating: 4.6,
    reviews: 189,
    deliveryTime: "25-40 min",
    deliveryFee: 4.99,
    minOrder: 20,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    logo: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=100",
    isOpen: true,
    isFeatured: true,
  },
  {
    id: 3,
    name: "Café & Cia",
    slug: "cafe-cia",
    segment: "Cafeteria",
    rating: 4.9,
    reviews: 156,
    deliveryTime: "20-30 min",
    deliveryFee: 3.99,
    minOrder: 15,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
    logo: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100",
    isOpen: true,
    isFeatured: false,
  },
  {
    id: 4,
    name: "Sushi Master",
    slug: "sushi-master",
    segment: "Japonês",
    rating: 4.7,
    reviews: 267,
    deliveryTime: "40-55 min",
    deliveryFee: 7.99,
    minOrder: 40,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400",
    logo: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=100",
    isOpen: false,
    isFeatured: true,
  },
  {
    id: 5,
    name: "Açaí Point",
    slug: "acai-point",
    segment: "Açaí",
    rating: 4.5,
    reviews: 98,
    deliveryTime: "15-25 min",
    deliveryFee: 2.99,
    minOrder: 18,
    image: "https://images.unsplash.com/photo-1590080876064-969ef54a28f2?w=400",
    logo: "https://images.unsplash.com/photo-1501746877-14782df58970?w=100",
    isOpen: true,
    isFeatured: false,
  },
  {
    id: 6,
    name: "Padaria Central",
    slug: "padaria-central",
    segment: "Padaria",
    rating: 4.4,
    reviews: 211,
    deliveryTime: "20-35 min",
    deliveryFee: 3.49,
    minOrder: 12,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
    logo: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=100",
    isOpen: true,
    isFeatured: false,
  },
];

const segments = [
  { id: "all", name: "Todos", icon: Utensils },
  { id: "pizzaria", name: "Pizzarias", icon: Pizza },
  { id: "hamburgueria", name: "Hambúrgueres", icon: Sandwich },
  { id: "cafeteria", name: "Cafés", icon: Coffee },
  { id: "acai", name: "Açaí", icon: IceCream },
  { id: "padaria", name: "Padarias", icon: Cake },
  { id: "mercado", name: "Mercados", icon: ShoppingBag },
];

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredEstablishments = establishments.filter((est) => {
    const matchesSearch = est.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          est.segment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = selectedSegment === "all" || 
                           est.segment.toLowerCase().includes(selectedSegment);
    return matchesSearch && matchesSegment;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Utensils className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-bold hidden sm:inline">
                Vila<span className="text-primary">Food</span>
              </span>
            </Link>

            {/* Location */}
            <button className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium">São Paulo, SP</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar restaurantes ou pratos..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-5 h-5" />
              </Button>
              <Link to="/auth">
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar restaurantes ou pratos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Segments Filter */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {segments.map((segment) => {
              const Icon = segment.icon;
              return (
                <button
                  key={segment.id}
                  onClick={() => setSelectedSegment(segment.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedSegment === segment.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{segment.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Featured Section */}
        {selectedSegment === "all" && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">🔥 Destaques</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {establishments.filter(e => e.isFeatured).map((est) => (
                <Link key={est.id} to={`/loja/${est.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="relative h-40">
                      <img
                        src={est.image}
                        alt={est.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {!est.isOpen && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge variant="secondary">Fechado</Badge>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-primary">Destaque</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={est.logo}
                          alt={est.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-background -mt-8 relative z-10"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{est.name}</h3>
                          <p className="text-sm text-muted-foreground">{est.segment}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{est.rating}</span>
                          <span className="text-muted-foreground">({est.reviews})</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{est.deliveryTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <span>Taxa: R$ {est.deliveryFee.toFixed(2)}</span>
                        <span>•</span>
                        <span>Pedido mín: R$ {est.minOrder}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Establishments */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {selectedSegment === "all" 
                ? "Todos os estabelecimentos" 
                : `${segments.find(s => s.id === selectedSegment)?.name || "Estabelecimentos"}`}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredEstablishments.length} encontrados
            </span>
          </div>

          {filteredEstablishments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Nenhum resultado encontrado</h3>
              <p className="text-muted-foreground">
                Tente buscar por outro termo ou categoria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEstablishments.map((est) => (
                <Link key={est.id} to={`/loja/${est.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full">
                    <div className="relative h-36">
                      <img
                        src={est.image}
                        alt={est.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {!est.isOpen && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge variant="secondary">Fechado</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={est.logo}
                          alt={est.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-background -mt-7 relative z-10"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{est.name}</h3>
                          <p className="text-sm text-muted-foreground">{est.segment}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{est.rating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{est.deliveryTime}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Marketplace;
