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
  Users,
  CreditCard,
  Store,
  Brain,
  Video,
  Camera,
  Cog,
  Settings,
  Plug,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AdminEstablishmentSwitcher from "@/components/admin/AdminEstablishmentSwitcher";
import NotificationCenter from "@/components/notifications/NotificationCenter";

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

const getMenuItems = (baseUrl: string) => [
  { icon: LayoutDashboard, label: "Dashboard", href: baseUrl },
  { icon: Brain, label: "Diagnóstico IA", href: `${baseUrl}/analise-ia`, badge: "Novo" },
  { icon: Store, label: "PDV", href: `${baseUrl}/pdv` },
  { icon: ShoppingBag, label: "Pedidos", href: `${baseUrl}/pedidos` },
  { icon: Calendar, label: "Agendados", href: `${baseUrl}/agendados` },
  { icon: ClipboardList, label: "Comanda Digital", href: `${baseUrl}/comanda` },
  { icon: ChefHat, label: "Display Cozinha", href: `${baseUrl}/cozinha` },
  { icon: Package, label: "Produtos", href: `${baseUrl}/produtos` },
  { icon: Tag, label: "Categorias", href: `${baseUrl}/categorias` },
  { icon: Boxes, label: "Estoque", href: `${baseUrl}/estoque` },
  { icon: Video, label: "VilaTok", href: `${baseUrl}/videos`, badge: "Novo" },
  { icon: Camera, label: "Stories", href: `${baseUrl}/stories` },
  { icon: Truck, label: "Área de Atendimento", href: `${baseUrl}/area-atendimento` },
  { icon: Bike, label: "Entregadores", href: `${baseUrl}/entregadores` },
  { icon: DollarSign, label: "Cupons", href: `${baseUrl}/cupons` },
  
  { icon: ShoppingCart, label: "Recuperador de Vendas", href: `${baseUrl}/carrinhos-abandonados` },
  { icon: CreditCard, label: "Pagamentos", href: `${baseUrl}/pagamentos` },
  { icon: TrendingUp, label: "Fluxo de Caixa", href: `${baseUrl}/fluxo` },
  { icon: Wallet, label: "Gestão Financeira", href: `${baseUrl}/financeiro` },
  { icon: Users, label: "Fornecedores", href: `${baseUrl}/fornecedores` },
  { icon: MessageSquare, label: "WhatsApp IA", href: `${baseUrl}/whatsapp` },
  { icon: BarChart3, label: "Relatórios", href: `${baseUrl}/relatorios` },
  { icon: LineChart, label: "Pixels Analytics", href: `${baseUrl}/pixels` },
  { icon: QrCode, label: "QR Code", href: `${baseUrl}/qrcode` },
  { icon: Eye, label: "Banners", href: `${baseUrl}/banners` },
  { icon: Plug, label: "Integrações", href: `${baseUrl}/integracoes` },
  { icon: Settings, label: "Configurações", href: `${baseUrl}/configuracoes` },
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
  const { slug } = useParams();
  const { user, signOut } = useAuth();
  const { appRole } = useUserRole();
  
  const baseUrl = slug ? `/painel/${slug}` : '/painel';
  const menuItems = getMenuItems(baseUrl);
  const isSuperAdmin = appRole === 'super_admin';

  const isActive = (href: string) => {
    return location.pathname === href;
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
        {/* Logo / Establishment */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
              {establishment?.logo_url ? (
                <img 
                  src={establishment.logo_url} 
                  alt={establishment.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Store className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm truncate block">
                {establishment?.name || 'VilaFood'}
              </span>
              <Badge variant="outline" className="text-xs">
                Painel
              </Badge>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationCenter />
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden shrink-0"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
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

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const itemBadge = 'badge' in item ? item.badge : null;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                {itemBadge && (
                  <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0">
                    {itemBadge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {establishment?.logo_url ? (
                <img 
                  src={establishment.logo_url} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-primary font-medium text-sm">
                  {establishment?.name?.substring(0, 2).toUpperCase() || 'VF'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{establishment?.name || 'Minha Loja'}</p>
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

export default DashboardSidebar;
