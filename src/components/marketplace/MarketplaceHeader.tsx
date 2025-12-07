import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  ShoppingCart,
  Menu,
  Globe,
  ChevronDown,
  Store,
  User,
} from "lucide-react";
import VilaTokStoriesRow from "./VilaTokStoriesRow";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { useMainCategories, getIconComponent } from "@/hooks/useMainCategories";
import { cn } from "@/lib/utils";
import { useDragScroll } from "@/hooks/useDragScroll";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import logoHorizontal from "@/assets/logo-horizontal.png";
import { LocationSelector } from "./LocationSelector";
import { UserMenu } from "./UserMenu";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";

interface MarketplaceHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchClick?: () => void;
}

// Separate Sticky Search Bar Component
export const StickySearchBar = ({ searchTerm, onSearchChange, onSearchClick }: MarketplaceHeaderProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm animate-in slide-in-from-top duration-200">
      <div className="container mx-auto px-4 py-2">
        <div className="relative" onClick={onSearchClick}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar restaurantes ou pratos..."
            className="pl-10 bg-muted/50 cursor-pointer"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={onSearchClick}
            readOnly={!!onSearchClick}
          />
        </div>
      </div>
    </div>
  );
};

const MarketplaceHeader = ({ searchTerm, onSearchChange, onSearchClick }: MarketplaceHeaderProps) => {
  const { items } = useCart();
  const { user } = useAuth();
  const { categories } = useMainCategories();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { scrollRef, isDragging, handlers } = useDragScroll({ direction: 'horizontal' });
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="bg-card shadow-sm">
        {/* Top Bar - Only visible for logged-in users */}
        {user && (
          <div className="bg-primary text-white">
            <div className="container mx-auto px-4 py-2">
              <div className="flex items-center justify-between">
                <LocationSelector />
                
                <div className="flex items-center gap-4">
                  <Link 
                    to="/conheca" 
                    className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors"
                  >
                    <Store className="w-4 h-4" />
                    Seja um Parceiro
                  </Link>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors">
                        <Globe className="w-4 h-4" />
                        <span className="hidden sm:inline">PT</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Português</DropdownMenuItem>
                      <DropdownMenuItem>English</DropdownMenuItem>
                      <DropdownMenuItem>Español</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <UserMenu />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Header */}
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src={logoHorizontal} alt="VilaFood" className="h-9 md:h-10" />
            </Link>

            {/* Navigation - Desktop */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Início
              </Link>
              <Link to="/?view=categories" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Categorias
              </Link>
              <Link to="/vilas" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Vilas
              </Link>
              <Link to="/?view=restaurants" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Restaurantes
              </Link>
              
              {/* Login button for non-logged users in header */}
              {!user && (
                <Link 
                  to="/auth" 
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Entrar
                </Link>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              <NotificationCenter />
              
              {/* Cart - Hidden on mobile (exists in bottom nav) */}
              <Link to="/checkout" className="hidden md:block">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Mobile Menu - Hidden on mobile (exists in bottom nav) */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden lg:hidden md:flex">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-4 mt-8">
                    <Link 
                      to="/" 
                      className="text-lg font-medium py-2 border-b border-border"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Início
                    </Link>
                    <Link 
                      to="/?view=categories" 
                      className="text-lg font-medium py-2 border-b border-border"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Categorias
                    </Link>
                    <Link 
                      to="/vilas" 
                      className="text-lg font-medium py-2 border-b border-border"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Vilas Gastronômicas
                    </Link>
                    <Link 
                      to="/?view=restaurants" 
                      className="text-lg font-medium py-2 border-b border-border"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Restaurantes
                    </Link>
                    
                    <div className="mt-6 pt-6 border-t border-border">
                      <Link 
                        to="/conheca"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button className="w-full btn-yellow">
                          <Store className="w-4 h-4 mr-2" />
                          Seja um Parceiro
                        </Button>
                      </Link>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Category Quick Access Buttons - Minimalist Pills */}
          <div className="mt-3 -mx-4 px-4">
            <div 
              ref={scrollRef}
              {...handlers}
              className={cn(
                "flex items-center gap-2 pb-2 overflow-x-auto scrollbar-hide",
                "cursor-grab active:cursor-grabbing select-none",
                isDragging && "cursor-grabbing"
              )}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.slice(0, 8).map((category) => {
                const IconComponent = getIconComponent(category.icon);
                return (
                  <button
                    key={category.id}
                    onClick={() => !isDragging && navigate(`/categoria/${category.slug}`)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                      "bg-muted/60 hover:bg-primary hover:text-primary-foreground",
                      "transition-all duration-200 shrink-0 border border-transparent",
                      "hover:border-primary/20 hover:shadow-sm"
                    )}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stories Row - Category/Establishment circles below categories */}
          <div className="mt-2 -mx-4">
            <VilaTokStoriesRow />
          </div>
        </div>
      </header>
  );
};

export default MarketplaceHeader;
