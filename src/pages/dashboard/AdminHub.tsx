import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, Shield, Bell, Plug, QrCode, CreditCard, Building2 } from 'lucide-react';

const AdminHub = () => {
  const { slug } = useParams();
  const baseUrl = `/painel/${slug}`;

  const adminTools = [
    {
      title: 'Configurações Gerais',
      description: 'Configure informações do estabelecimento',
      icon: Settings,
      href: `${baseUrl}/configuracoes`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Equipe',
      description: 'Gerencie colaboradores e permissões',
      icon: Users,
      href: `${baseUrl}/equipe`,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Integrações',
      description: 'Configure integrações com serviços externos',
      icon: Plug,
      href: `${baseUrl}/integracoes`,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'WhatsApp',
      description: 'Configure o agente de WhatsApp e chatbot',
      icon: Bell,
      href: `${baseUrl}/whatsapp`,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'QR Codes',
      description: 'Gere QR codes para mesas e cardápio',
      icon: QrCode,
      href: `${baseUrl}/qrcodes`,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Pagamentos',
      description: 'Configure métodos de pagamento e taxas',
      icon: CreditCard,
      href: `${baseUrl}/pagamentos`,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Mercado Pago',
      description: 'Conecte sua conta Mercado Pago',
      icon: Building2,
      href: `${baseUrl}/mercado-pago`,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10',
    },
    {
      title: 'Segurança (Em breve)',
      description: 'Configure autenticação e segurança',
      icon: Shield,
      href: '#',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      disabled: true,
    },
  ];

  return (
    <DashboardLayout title="Administração">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminTools.map((tool) => (
          <Link
            key={tool.title}
            to={tool.disabled ? '#' : tool.href}
            className={tool.disabled ? 'cursor-not-allowed' : ''}
          >
            <Card className={`h-full transition-all hover:shadow-md ${tool.disabled ? 'opacity-60' : 'hover:border-primary/50'}`}>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-lg ${tool.bgColor}`}>
                  <tool.icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminHub;
