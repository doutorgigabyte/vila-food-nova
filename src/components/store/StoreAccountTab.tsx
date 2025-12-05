import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  LogOut,
  Moon,
  Sun,
  LayoutDashboard,
  Store,
  Shield,
  Users,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  Truck,
  Building,
  ChevronRight,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, EstablishmentRole } from "@/hooks/useUserRole";
import { useTheme } from "next-themes";

interface StoreAccountTabProps {
  establishmentSlug?: string;
}

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

export const StoreAccountTab = ({ establishmentSlug }: StoreAccountTabProps) => {
  const { user, signOut } = useAuth();
  const { appRole, establishmentRole, establishmentSlug: userEstSlug, permissions, isLoading } = useUserRole();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Not logged in state
  if (!user) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Minha Conta</h2>
          <p className="text-muted-foreground mb-6">
            Faça login para ver seus pedidos e acompanhar entregas
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth?mode=signup">Criar conta</Link>
            </Button>
          </div>
        </div>

        {/* Theme Toggle for guests */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <button 
              onClick={toggleTheme}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>Tema {theme === "dark" ? "claro" : "escuro"}</span>
              </div>
              <Switch checked={theme === "dark"} />
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário";
  const userInitials = userName.substring(0, 2).toUpperCase();
  const displayRole = establishmentRole || appRole || "customer";
  const roleInfo = roleLabels[displayRole] || roleLabels.customer;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="p-4 space-y-4">
      {/* User Profile Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg">{userName}</h2>
                {!isLoading && (
                  <Badge 
                    variant="secondary" 
                    className={`text-[10px] px-1.5 py-0 text-white ${roleInfo.color}`}
                  >
                    {roleInfo.label}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access for Staff */}
      {(appRole === "super_admin" || appRole === "establishment" || establishmentRole) && (
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Acesso Rápido
              </p>
            </div>
            <div className="divide-y divide-border">
              {/* Super Admin */}
              {appRole === "super_admin" && (
                <>
                  <Link to="/admin" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-red-500" />
                      <span>Painel Admin</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <Link to="/admin/estabelecimentos" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5" />
                      <span>Estabelecimentos</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </>
              )}

              {/* Establishment Owner/Manager */}
              {appRole === "establishment" && establishmentRole === "manager" && (
                <>
                  <Link to="/painel" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="w-5 h-5 text-blue-500" />
                      <span>Painel da Loja</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <Link to="/painel/pedidos" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5" />
                      <span>Gerenciar Pedidos</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <Link to="/painel/pdv" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Receipt className="w-5 h-5" />
                      <span>PDV</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </>
              )}

              {/* Cashier */}
              {establishmentRole === "cashier" && (
                <>
                  <Link to="/painel/pdv" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Receipt className="w-5 h-5 text-green-500" />
                      <span>PDV</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </>
              )}

              {/* Waiter/Attendant */}
              {(establishmentRole === "waiter" || establishmentRole === "attendant") && (
                <Link to="/painel/comanda" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <UtensilsCrossed className="w-5 h-5 text-amber-500" />
                    <span>Comanda Digital</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}

              {/* Delivery */}
              {establishmentRole === "delivery" && (
                <Link to="/painel/entregas" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-cyan-500" />
                    <span>Minhas Entregas</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}

              {/* Kitchen Staff */}
              {permissions.canAccessKitchen && establishmentRole !== "manager" && (
                <Link to="/painel/cozinha" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <ChefHat className="w-5 h-5 text-orange-500" />
                    <span>Display Cozinha</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Menu */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Minha Conta
            </p>
          </div>
          <div className="divide-y divide-border">
            <Link to="/pedidos" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5" />
                <span>Meus pedidos</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link to="/checkout" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5" />
                <span>Meus endereços</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link to="/conta" className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                <span>Configurações</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Theme & Settings */}
      <Card>
        <CardContent className="p-0">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>Tema {theme === "dark" ? "claro" : "escuro"}</span>
            </div>
            <Switch checked={theme === "dark"} />
          </button>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button 
        variant="outline" 
        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair da conta
      </Button>
    </div>
  );
};
