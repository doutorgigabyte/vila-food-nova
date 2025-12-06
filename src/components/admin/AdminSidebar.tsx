import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard,
  Building2,
  Users,
  MapPin,
  Layers,
  CreditCard,
  Gift,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  Ticket,
  Map,
  Store,
  ShoppingCart,
  Package,
  Rocket,
  Database,
  Heart,
  Tag,
  UserCheck,
  Image
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  children?: { icon: React.ElementType; label: string; href: string }[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Building2, label: "Estabelecimentos", href: "/admin/estabelecimentos" },
  { icon: Users, label: "Usuários", href: "/admin/usuarios" },
  { icon: UserCheck, label: "Afiliados", href: "/admin/afiliados" },
  { 
    icon: MapPin, 
    label: "Localidades",
    children: [
      { icon: Map, label: "Estados", href: "/admin/estados" },
      { icon: MapPin, label: "Cidades", href: "/admin/cidades" },
      { icon: Store, label: "Vilas", href: "/admin/vilas" },
    ]
  },
  { 
    icon: Layers, 
    label: "Tipos de Negócio",
    children: [
      { icon: Layers, label: "Áreas", href: "/admin/categorias-principais" },
      { icon: Tag, label: "Segmentos", href: "/admin/segmentos" },
    ]
  },
  { icon: CreditCard, label: "Planos", href: "/admin/planos" },
  { icon: Gift, label: "Assinaturas", href: "/admin/assinaturas" },
  { icon: Ticket, label: "Vouchers", href: "/admin/vouchers" },
  { 
    icon: ShoppingCart, 
    label: "Catálogo",
    children: [
      { icon: Package, label: "Produtos", href: "/admin/produtos" },
      { icon: Layers, label: "Categorias", href: "/admin/categorias" },
      { icon: ShoppingCart, label: "Pedidos", href: "/admin/pedidos" },
    ]
  },
  { icon: BarChart3, label: "Relatórios", href: "/admin/relatorios" },
  { 
    icon: Shield, 
    label: "Sistema",
    children: [
      { icon: Heart, label: "Health Check", href: "/admin/health" },
      { icon: Rocket, label: "Roadmap", href: "/admin/roadmap" },
      { icon: Database, label: "Migração", href: "/admin/migracao" },
      { icon: Image, label: "Preencher Imagens", href: "/admin/preencher-imagens" },
    ]
  },
  { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href;
  };

  const isGroupActive = (children?: NavItem['children']) => {
    if (!children) return false;
    return children.some(child => location.pathname === child.href || location.pathname.startsWith(child.href));
  };

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => 
      prev.includes(label) 
        ? prev.filter(g => g !== label)
        : [...prev, label]
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`}>
      <div className="flex flex-col h-full">
        {/* Header with Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <img src={logo} alt="VilaFood" className="h-8" />
            <Badge variant="destructive" className="text-xs">
              Admin
            </Badge>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isItemActive = isActive(item.href);
            const isChildActive = isGroupActive(item.children);
            const isOpen = openGroups.includes(item.label) || isChildActive;

            if (hasChildren) {
              return (
                <Collapsible 
                  key={item.label} 
                  open={isOpen}
                  onOpenChange={() => toggleGroup(item.label)}
                >
                  <CollapsibleTrigger asChild>
                    <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                      isChildActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}>
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 mt-1 space-y-1">
                    {item.children!.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildItemActive = isActive(child.href);
                      return (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isChildItemActive 
                              ? "bg-primary/10 text-primary" 
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <ChildIcon className="w-4 h-4" />
                          <span className="text-sm">{child.label}</span>
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.href!}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isItemActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">Super Admin</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSignOut}
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
