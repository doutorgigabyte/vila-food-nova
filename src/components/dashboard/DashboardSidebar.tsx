import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Utensils, 
  Store, 
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
  Settings,
  LogOut,
  ClipboardList,
  Gift,
  ShoppingCart,
  Calendar,
  Bike,
  ChefHat,
  LineChart,
  Boxes,
  Wallet,
  Users
} from "lucide-react";
import { toast } from "sonner";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  storeOpen?: boolean;
  onToggleStore?: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/painel" },
  { icon: Store, label: "PDV", href: "/painel/pdv" },
  { icon: ShoppingBag, label: "Pedidos", href: "/painel/pedidos" },
  { icon: Calendar, label: "Agendados", href: "/painel/agendados" },
  { icon: ClipboardList, label: "Comanda Digital", href: "/painel/comanda" },
  { icon: ChefHat, label: "Display Cozinha", href: "/painel/cozinha" },
  { icon: Package, label: "Produtos", href: "/painel/produtos" },
  { icon: Tag, label: "Categorias", href: "/painel/categorias" },
  { icon: Boxes, label: "Estoque", href: "/painel/estoque" },
  { icon: Truck, label: "Área de Atendimento", href: "/painel/area-atendimento" },
  { icon: Bike, label: "Entregadores", href: "/painel/entregadores" },
  { icon: DollarSign, label: "Cupons", href: "/painel/cupons" },
  { icon: Gift, label: "Cashback", href: "/painel/cashback" },
  { icon: ShoppingCart, label: "Recuperador de Vendas", href: "/painel/carrinhos-abandonados" },
  { icon: TrendingUp, label: "Fluxo de Caixa", href: "/painel/fluxo" },
  { icon: Wallet, label: "Gestão Financeira", href: "/painel/financeiro" },
  { icon: Users, label: "Fornecedores", href: "/painel/fornecedores" },
  { icon: MessageSquare, label: "WhatsApp IA", href: "/painel/whatsapp" },
  { icon: BarChart3, label: "Relatórios", href: "/painel/relatorios" },
  { icon: LineChart, label: "Pixels Analytics", href: "/painel/pixels" },
  { icon: QrCode, label: "QR Code", href: "/painel/qrcode" },
  { icon: Eye, label: "Banners", href: "/painel/banners" },
  { icon: Settings, label: "Integrações", href: "/painel/integracoes" },
];

const DashboardSidebar = ({ isOpen, onClose, storeOpen = true, onToggleStore }: DashboardSidebarProps) => {
  const location = useLocation();

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Utensils className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold">
              Vila<span className="text-primary">Food</span>
            </span>
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
            <Badge className={`mt-2 ${storeOpen ? "bg-green-500" : "bg-red-500"}`}>
              {storeOpen ? "Aberta" : "Fechada"}
            </Badge>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium">VF</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">Minha Loja</p>
              <p className="text-xs text-muted-foreground truncate">painel@vilafood.com</p>
            </div>
            <Button variant="ghost" size="icon">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
