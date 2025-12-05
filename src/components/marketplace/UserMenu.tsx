import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Settings, 
  ShoppingBag, 
  MapPin, 
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  LayoutDashboard,
  Store,
  Shield,
  Users,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  Truck,
  Building
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, EstablishmentRole, AppRole } from "@/hooks/useUserRole";
import { useTheme } from "next-themes";

// Role display info
const roleLabels: Record<string, { label: string; color: string }> = {
  super_admin: { label: "Super Admin", color: "bg-red-500" },
  establishment: { label: "Proprietário", color: "bg-blue-500" },
  manager: { label: "Gerente", color: "bg-purple-500" },
  cashier: { label: "Caixa", color: "bg-green-500" },
  attendant: { label: "Atendente", color: "bg-orange-500" },
  waiter: { label: "Garçom", color: "bg-amber-500" },
  delivery: { label: "Entregador", color: "bg-cyan-500" },
  customer: { label: "Cliente", color: "bg-gray-500" },
};

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { appRole, establishmentRole, establishmentSlug, permissions, isLoading } = useUserRole();
  const { theme, setTheme } = useTheme();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/auth" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Entrar</span>
        </Link>
      </div>
    );
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário";
  const userInitials = userName.substring(0, 2).toUpperCase();

  // Determine which role to display
  const displayRole = establishmentRole || appRole || "customer";
  const roleInfo = roleLabels[displayRole] || roleLabels.customer;

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity">
          <Avatar className="w-7 h-7">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline max-w-[100px] truncate font-medium">
            {userName}
          </span>
          <ChevronDown className="w-3 h-3 hidden sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{userName}</span>
              {!isLoading && (
                <Badge 
                  variant="secondary" 
                  className={`text-[10px] px-1.5 py-0 text-white ${roleInfo.color}`}
                >
                  {roleInfo.label}
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Super Admin Quick Access */}
        {appRole === "super_admin" && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Acesso Rápido Admin
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/admin" className="cursor-pointer">
                  <Shield className="w-4 h-4 mr-2 text-red-500" />
                  Painel Admin
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/estabelecimentos" className="cursor-pointer">
                  <Building className="w-4 h-4 mr-2" />
                  Estabelecimentos
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/usuarios" className="cursor-pointer">
                  <Users className="w-4 h-4 mr-2" />
                  Usuários
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Establishment Owner Quick Access */}
        {appRole === "establishment" && establishmentRole === "manager" && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Acesso Rápido Loja
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/painel" className="cursor-pointer">
                  <LayoutDashboard className="w-4 h-4 mr-2 text-blue-500" />
                  Painel da Loja
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/painel/pedidos" className="cursor-pointer">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Pedidos
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/painel/pdv" className="cursor-pointer">
                  <Receipt className="w-4 h-4 mr-2" />
                  PDV
                </Link>
              </DropdownMenuItem>
              {establishmentSlug && (
                <DropdownMenuItem asChild>
                  <Link to={`/loja/${establishmentSlug}`} className="cursor-pointer">
                    <Store className="w-4 h-4 mr-2" />
                    Ver Minha Loja
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Cashier Quick Access */}
        {establishmentRole === "cashier" && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Acesso Rápido
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/painel/pdv" className="cursor-pointer">
                  <Receipt className="w-4 h-4 mr-2 text-green-500" />
                  PDV
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/painel/pedidos" className="cursor-pointer">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Pedidos
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Waiter/Attendant Quick Access */}
        {(establishmentRole === "waiter" || establishmentRole === "attendant") && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Acesso Rápido
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/painel/comanda" className="cursor-pointer">
                  <UtensilsCrossed className="w-4 h-4 mr-2 text-amber-500" />
                  Comanda Digital
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/painel/pedidos" className="cursor-pointer">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Pedidos
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Delivery Driver Quick Access */}
        {establishmentRole === "delivery" && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Acesso Rápido
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/painel/entregas" className="cursor-pointer">
                  <Truck className="w-4 h-4 mr-2 text-cyan-500" />
                  Minhas Entregas
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Kitchen Staff Quick Access */}
        {permissions.canAccessKitchen && establishmentRole !== "manager" && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Acesso Rápido
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/painel/cozinha" className="cursor-pointer">
                  <ChefHat className="w-4 h-4 mr-2 text-orange-500" />
                  Display Cozinha
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Customer Menu - Always shown */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/pedidos" className="cursor-pointer">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Meus pedidos
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/checkout" className="cursor-pointer">
              <MapPin className="w-4 h-4 mr-2" />
              Meus endereços
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/conta" className="cursor-pointer">
              <User className="w-4 h-4 mr-2" />
              Minha conta
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            toggleTheme();
          }}
          className="cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 mr-2" />
          ) : (
            <Moon className="w-4 h-4 mr-2" />
          )}
          <span className="flex-1">Tema {theme === "dark" ? "claro" : "escuro"}</span>
          <Switch 
            checked={theme === "dark"} 
            onCheckedChange={toggleTheme}
            className="ml-2"
          />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
