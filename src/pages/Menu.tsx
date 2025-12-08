import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  MapPin, 
  ClipboardList, 
  Settings, 
  LogOut, 
  ChevronRight,
  Store,
  LayoutDashboard,
  Moon,
  Sun,
  Heart
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import MobileBottomNav from "@/components/marketplace/MobileBottomNav";

const Menu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { appRole, establishmentRole, establishmentSlug } = useUserRole();
  const { theme, setTheme } = useTheme();
  const role = establishmentRole || appRole;

  const handleSignOut = async () => {
    await signOut();
    navigate("/marketplace");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string | null) => {
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      owner: "Proprietário",
      manager: "Gerente",
      cashier: "Caixa",
      attendant: "Atendente",
      waiter: "Garçom",
      delivery_driver: "Entregador",
    };
    return labels[role || ""] || "Cliente";
  };

  const menuItems = [
    { icon: ClipboardList, label: "Meus Pedidos", path: "/pedidos" },
    { icon: Heart, label: "Favoritos", path: "/favoritos" },
    { icon: MapPin, label: "Meus Endereços", path: "/enderecos" },
    { icon: User, label: "Minha Conta", path: "/conta" },
  ];

  const adminItems: { icon: typeof LayoutDashboard; label: string; path: string }[] = [];
  if (appRole === "super_admin") {
    adminItems.push({ icon: LayoutDashboard, label: "Painel Admin", path: "/admin" });
  }
  if (establishmentSlug && (appRole === "super_admin" || establishmentRole === "manager")) {
    adminItems.push({ icon: Store, label: "Painel da Loja", path: `/painel/${establishmentSlug}` });
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <h1 className="text-xl font-bold mb-4">Menu</h1>
        
        {user ? (
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary-foreground/30">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-lg">
                {getInitials(user.user_metadata?.full_name || user.email || "U")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">
                {user.user_metadata?.full_name || user.email?.split("@")[0]}
              </p>
              <p className="text-sm opacity-80">{user.email}</p>
              <span className="inline-block mt-1 text-xs bg-primary-foreground/20 px-2 py-0.5 rounded-full">
                {getRoleLabel(role)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary-foreground/30">
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">Visitante</p>
              <Link to="/auth" className="text-sm underline opacity-80">
                Fazer login ou cadastrar
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Admin Links */}
        {adminItems.length > 0 && (
          <Card className="overflow-hidden">
            <div className="p-3 bg-muted/50">
              <p className="text-sm font-medium text-muted-foreground">Administração</p>
            </div>
            {adminItems.map((item, index) => (
              <Link key={item.path} to={item.path}>
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                {index < adminItems.length - 1 && <Separator />}
              </Link>
            ))}
          </Card>
        )}

        {/* Menu Items - Only for logged-in users */}
        {user && (
          <Card className="overflow-hidden">
            {menuItems.map((item, index) => (
              <Link key={item.path} to={item.path}>
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                {index < menuItems.length - 1 && <Separator />}
              </Link>
            ))}
          </Card>
        )}

        {/* Settings */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-medium">Modo Escuro</span>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
          <Separator />
          <Link to="/configuracoes">
            <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Configurações</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        </Card>

        {/* Logout */}
        {user && (
          <Button 
            variant="outline" 
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair da conta
          </Button>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default Menu;
