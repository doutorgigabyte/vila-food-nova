import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  X,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  Truck,
  DollarSign,
  TrendingUp,
  MessageSquare,
  BarChart3,
  QrCode,
  Eye,
  LogOut,
  ClipboardList,
  ShoppingCart,
  Calendar,
  Bike,
  ChefHat,
  LineChart,
  Boxes,
  Wallet,
  CreditCard,
  Store,
  Brain,
  Video,
  Tv,
  Camera,
  Settings,
  Plug,
  Star,
  PackagePlus,
  Layers,
  Receipt,
  ChevronDown,
  ChevronRight,
  MapPin,
  Megaphone,
  Headphones,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AdminEstablishmentSwitcher from "@/components/admin/AdminEstablishmentSwitcher";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import logoHorizontal from "@/assets/logo-horizontal.png";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  storeOpen?: boolean;
  onToggleStore?: () => void;
  establishment?: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
  } | null;
}

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string;
}

interface MenuGroup {
  title: string;
  icon: LucideIcon;
  items: MenuItem[];
}

const getMenuGroups = (baseUrl: string): MenuGroup[] => [
  {
    title: "Operações",
    icon: Store,
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: baseUrl },
      { icon: Store, label: "PDV", href: `${baseUrl}/pdv` },
      { icon: ShoppingBag, label: "Pedidos", href: `${baseUrl}/pedidos` },
      { icon: Calendar, label: "Agendados", href: `${baseUrl}/agendados` },
      { icon: ClipboardList, label: "Comanda Digital", href: `${baseUrl}/comanda` },
      { icon: ChefHat, label: "Display Cozinha", href: `${baseUrl}/cozinha` },
    ],
  },
  {
    title: "Catálogo",
    icon: Package,
    items: [
      { icon: Package, label: "Produtos", href: `${baseUrl}/produtos` },
      { icon: PackagePlus, label: "Kits de Produtos", href: `${baseUrl}/kits` },
      { icon: Layers, label: "Complementos", href: `${baseUrl}/complementos` },
      { icon: Tag, label: "Categorias", href: `${baseUrl}/categorias` },
      { icon: Boxes, label: "Estoque", href: `${baseUrl}/estoque` },
    ],
  },
  {
    title: "Entregas",
    icon: Truck,
    items: [
      { icon: MapPin, label: "Área de Atendimento", href: `${baseUrl}/area-atendimento` },
      { icon: Bike, label: "Entregadores", href: `${baseUrl}/entregadores` },
    ],
  },
  {
    title: "Financeiro",
    icon: Wallet,
    items: [
      { icon: CreditCard, label: "Pagamentos", href: `${baseUrl}/pagamentos` },
      { icon: Receipt, label: "Extrato Comissões", href: `${baseUrl}/comissoes`, badge: "Novo" },
      { icon: TrendingUp, label: "Fluxo de Caixa", href: `${baseUrl}/fluxo` },
      { icon: Wallet, label: "Gestão Financeira", href: `${baseUrl}/financeiro` },
    ],
  },
  {
    title: "Marketing",
    icon: Megaphone,
    items: [
      { icon: DollarSign, label: "Cupons", href: `${baseUrl}/cupons` },
      { icon: ShoppingCart, label: "Recuperador de Vendas", href: `${baseUrl}/carrinhos-abandonados` },
      { icon: Video, label: "VilaTok", href: `${baseUrl}/videos` },
      { icon: Tv, label: "VilaTok TV", href: `${baseUrl}/vilatok-tv`, badge: "Novo" },
      { icon: Camera, label: "Stories", href: `${baseUrl}/stories` },
      { icon: Eye, label: "Banners", href: `${baseUrl}/banners` },
      { icon: Star, label: "Avaliações", href: `${baseUrl}/avaliacoes`, badge: "Novo" },
    ],
  },
  {
    title: "Inteligência",
    icon: Brain,
    items: [
      { icon: Brain, label: "Diagnóstico IA", href: `${baseUrl}/analise-ia`, badge: "Novo" },
      { icon: MessageSquare, label: "WhatsApp", href: `${baseUrl}/whatsapp` },
      { icon: BarChart3, label: "Relatórios", href: `${baseUrl}/relatorios` },
      { icon: LineChart, label: "Pixels Analytics", href: `${baseUrl}/pixels` },
      { icon: Headphones, label: "Suporte", href: `${baseUrl}/suporte`, badge: "Novo" },
    ],
  },
  {
    title: "Administração",
    icon: Settings,
    items: [
      { icon: QrCode, label: "QR Code", href: `${baseUrl}/qrcode` },
      { icon: Plug, label: "Integrações", href: `${baseUrl}/integracoes` },
      { icon: Users, label: "Equipe", href: `${baseUrl}/equipe`, badge: "Novo" },
      { icon: Settings, label: "Preferências", href: `${baseUrl}/configuracoes` },
    ],
  },
];

const DashboardSidebar = ({ 
  isOpen, 
  onClose, 
  storeOpen = true, 
  onToggleStore,
  establishment 
}: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug: routeSlug } = useParams();
  const { user, signOut } = useAuth();
  const { appRole } = useUserRole();
  
  // Priorizar o slug do establishment passado via prop
  const slug = establishment?.slug || routeSlug;
  const baseUrl = slug ? `/painel/${slug}` : '/painel';
  const menuGroups = getMenuGroups(baseUrl);
  const isSuperAdmin = appRole === 'super_admin';

  // Determine which groups should be open by default (containing active route)
  const getInitialOpenGroups = () => {
    const openGroups: Record<string, boolean> = {};
    menuGroups.forEach((group) => {
      const hasActiveItem = group.items.some(item => location.pathname === item.href);
      openGroups[group.title] = hasActiveItem;
    });
    // Always open "Operações" by default
    openGroups["Operações"] = true;
    return openGroups;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialOpenGroups);

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
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
        {/* Establishment Header - Logo e Nome da Loja */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Logo circular do estabelecimento */}
              <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                {establishment?.logo_url ? (
                  <img 
                    src={establishment.logo_url} 
                    alt={establishment.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-primary font-bold text-lg">
                    {establishment?.name?.substring(0, 2).toUpperCase() || 'VF'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-base truncate block">
                  {establishment?.name || 'Minha Loja'}
                </span>
                <Badge variant="secondary" className="text-xs mt-0.5">
                  Painel da Loja
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <NotificationCenter />
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Super Admin Switcher */}
        {isSuperAdmin && (
          <div className="p-4 border-b border-border">
            <AdminEstablishmentSwitcher />
          </div>
        )}

        {/* Store Status */}
        {onToggleStore && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Status da loja</span>
              </div>
              <Switch checked={storeOpen} onCheckedChange={onToggleStore} />
            </div>
            <Badge className={`mt-2 ${storeOpen ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}>
              {storeOpen ? "Aberta" : "Fechada"}
            </Badge>
          </div>
        )}

        {/* Navigation with Collapsible Groups */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {menuGroups.map((group) => {
            const GroupIcon = group.icon;
            const isGroupOpen = openGroups[group.title] ?? false;
            const hasActiveItem = group.items.some(item => isActive(item.href));

            return (
              <Collapsible
                key={group.title}
                open={isGroupOpen}
                onOpenChange={() => toggleGroup(group.title)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      hasActiveItem 
                        ? "bg-primary/5 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <GroupIcon className="w-5 h-5 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-left">{group.title}</span>
                    {isGroupOpen ? (
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 mt-1 space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.label}
                        to={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          active 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-sm">{item.label}</span>
                        {item.badge && (
                          <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>

        {/* User Footer - Usuário logado */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              <span className="text-primary font-medium text-sm">
                {user?.email?.substring(0, 2).toUpperCase() || 'US'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.email?.split('@')[0] || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground truncate">
                {appRole === 'super_admin' ? 'Super Admin' : 'Proprietário'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSignOut}
              title="Sair"
              className="shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
