import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Globe, 
  Building2, 
  CreditCard, 
  Home,
  ChevronDown,
  Plus,
  List,
  MapPin,
  Map,
  Layers,
  Package,
  ShoppingCart,
  Image,
  Star,
  Ticket,
  LogOut,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: {
    label: string;
    icon: React.ElementType;
    href: string;
  }[];
}

const navItems: NavItem[] = [
  {
    label: 'Início',
    icon: Home,
    href: '/admin'
  },
  {
    label: 'Usuários',
    icon: Users,
    children: [
      { label: 'Adicionar', icon: Plus, href: '/admin/usuarios/adicionar' },
      { label: 'Gerenciar', icon: List, href: '/admin/usuarios' }
    ]
  },
  {
    label: 'Segmentação',
    icon: Globe,
    children: [
      { label: 'Cidades', icon: MapPin, href: '/admin/cidades' },
      { label: 'Estados', icon: Map, href: '/admin/estados' },
      { label: 'Segmentos', icon: Layers, href: '/admin/segmentos' }
    ]
  },
  {
    label: 'Subdomínios',
    icon: Globe,
    children: [
      { label: 'Adicionar novo', icon: Plus, href: '/admin/vilas/adicionar' },
      { label: 'Gerenciar', icon: List, href: '/admin/vilas' }
    ]
  },
  {
    label: 'Estabelecimentos',
    icon: Building2,
    children: [
      { label: 'Adicionar novo', icon: Plus, href: '/admin/estabelecimentos/adicionar' },
      { label: 'Gerenciar', icon: List, href: '/admin/estabelecimentos' },
      { label: 'Categorias', icon: Layers, href: '/admin/categorias' },
      { label: 'Produtos', icon: Package, href: '/admin/produtos' },
      { label: 'Pedidos', icon: ShoppingCart, href: '/admin/pedidos' },
      { label: 'Banners', icon: Image, href: '/admin/banners' }
    ]
  },
  {
    label: 'Planos',
    icon: CreditCard,
    children: [
      { label: 'Adicionar novo', icon: Plus, href: '/admin/planos/adicionar' },
      { label: 'Gerenciar', icon: List, href: '/admin/planos' },
      { label: 'Assinaturas', icon: Star, href: '/admin/assinaturas' },
      { label: 'Vouchers', icon: Ticket, href: '/admin/vouchers' }
    ]
  }
];

const AdminNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const isActive = (href?: string, children?: NavItem['children']) => {
    if (href) return location.pathname === href;
    if (children) return children.some(child => location.pathname.startsWith(child.href));
    return false;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/admin" className="flex items-center gap-2">
            <img src={logo} alt="VilaFood" className="h-10" />
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              item.children ? (
                <DropdownMenu 
                  key={item.label}
                  open={openDropdown === item.label}
                  onOpenChange={(open) => setOpenDropdown(open ? item.label : null)}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={isActive(item.href, item.children) ? 'default' : 'ghost'}
                      className="gap-1"
                    >
                      {item.label}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.href} asChild>
                        <Link to={child.href} className="flex items-center gap-2 cursor-pointer">
                          <child.icon className="h-4 w-4" />
                          {child.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  key={item.label}
                  variant={isActive(item.href) ? 'default' : 'ghost'}
                  asChild
                >
                  <Link to={item.href!}>{item.label}</Link>
                </Button>
              )
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Portal
              </Link>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden md:inline">{user?.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/admin/configuracoes" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
