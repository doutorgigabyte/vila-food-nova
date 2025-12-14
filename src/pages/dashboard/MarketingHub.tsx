import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, Tag, Video, Tv, Gift, Mail } from 'lucide-react';

const MarketingHub = () => {
  const { slug } = useParams();
  const baseUrl = `/painel/${slug}`;

  const marketingTools = [
    {
      title: 'Cupons e Vouchers',
      description: 'Crie e gerencie cupons de desconto para seus clientes',
      icon: Tag,
      href: `${baseUrl}/cupons`,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'VilaTok Stories',
      description: 'Publique stories verticais para engajar seus clientes',
      icon: Video,
      href: `${baseUrl}/stories`,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'VilaTok TV',
      description: 'Slides horizontais para exibição em TVs do estabelecimento',
      icon: Tv,
      href: `${baseUrl}/vilatok-tv`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Banners',
      description: 'Gerencie os banners promocionais da sua loja',
      icon: Megaphone,
      href: `${baseUrl}/banners`,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Programa de Fidelidade',
      description: 'Configure pontos e recompensas para clientes fiéis',
      icon: Gift,
      href: `${baseUrl}/fidelidade`,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      title: 'Campanhas (Em breve)',
      description: 'Envie campanhas de e-mail e WhatsApp para seus clientes',
      icon: Mail,
      href: '#',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      disabled: true,
    },
  ];

  return (
    <DashboardLayout title="Marketing">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {marketingTools.map((tool) => (
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

export default MarketingHub;
