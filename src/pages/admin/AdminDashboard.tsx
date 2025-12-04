import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Globe, 
  Building2, 
  Star,
  Ticket,
  CreditCard,
  MessageSquare,
  ShoppingBag,
  PlayCircle,
  Bell,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Store
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const dashboardCards: DashboardCard[] = [
  {
    title: 'Usuários',
    description: 'Gerenciar acessos ao sistema',
    icon: Users,
    href: '/admin/usuarios',
    color: 'bg-red-100 text-red-600'
  },
  {
    title: 'Subdomínios',
    description: 'Configurar URLs do sistema',
    icon: Globe,
    href: '/admin/vilas',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    title: 'Estabelecimentos',
    description: 'Cadastro de lojas e empresas',
    icon: Building2,
    href: '/admin/estabelecimentos',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    title: 'Assinaturas',
    description: 'Planos contratados',
    icon: Star,
    href: '/admin/assinaturas',
    color: 'bg-green-100 text-green-600'
  },
  {
    title: 'Vouchers',
    description: 'Cupons de desconto',
    icon: Ticket,
    href: '/admin/vouchers',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    title: 'Planos',
    description: 'Tipos de assinatura',
    icon: CreditCard,
    href: '/admin/planos',
    color: 'bg-cyan-100 text-cyan-600'
  },
  {
    title: 'Vídeo Aulas',
    description: 'Tutoriais do sistema',
    icon: PlayCircle,
    href: '/admin/videos',
    color: 'bg-pink-100 text-pink-600'
  },
  {
    title: 'WhatsApp Marketing',
    description: 'Links de contato',
    icon: MessageSquare,
    href: '/admin/whatsapp',
    color: 'bg-emerald-100 text-emerald-600'
  },
  {
    title: 'Marketplaces',
    description: 'Todas as lojas do sistema',
    icon: ShoppingBag,
    href: '/admin/marketplaces',
    color: 'bg-amber-100 text-amber-600'
  },
  {
    title: 'Enviar Notificação',
    description: 'Notificar estabelecimentos',
    icon: Bell,
    href: '/admin/notificacoes',
    color: 'bg-indigo-100 text-indigo-600'
  }
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEstablishments: 0,
    activeEstablishments: 0,
    totalUsers: 0,
    totalPlans: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [establishmentsRes, profilesRes, plansRes] = await Promise.all([
          supabase.from('establishments').select('id, status', { count: 'exact' }),
          supabase.from('profiles').select('id', { count: 'exact' }),
          supabase.from('plans').select('id', { count: 'exact' })
        ]);

        setStats({
          totalEstablishments: establishmentsRes.count || 0,
          activeEstablishments: establishmentsRes.data?.filter(e => e.status === 'active').length || 0,
          totalUsers: profilesRes.count || 0,
          totalPlans: plansRes.count || 0,
          monthlyRevenue: 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout title="Dashboard Administrativo" breadcrumb="Dashboard Administrativo">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estabelecimentos</p>
                <p className="text-3xl font-bold">{stats.totalEstablishments}</p>
                <p className="text-xs text-green-600">{stats.activeEstablishments} ativos</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Store className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">cadastrados</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Planos</p>
                <p className="text-3xl font-bold">{stats.totalPlans}</p>
                <p className="text-xs text-muted-foreground">disponíveis</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Mensal</p>
                <p className="text-3xl font-bold">R$ {stats.monthlyRevenue.toFixed(2)}</p>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% este mês
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Acesso Rápido</h2>
        <Button variant="destructive" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Chamar Suporte
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboardCards.map((card) => (
          <Link key={card.href} to={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{card.title}</h3>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
