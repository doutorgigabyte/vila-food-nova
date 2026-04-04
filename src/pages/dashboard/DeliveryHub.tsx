import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Users, MapPin, Clock, Route, Package } from 'lucide-react';

const DeliveryHub = () => {
  const { slug } = useParams();
  const baseUrl = `/painel/${slug}`;

  const deliveryTools = [
    {
      title: 'Entregadores',
      description: 'Gerencie sua equipe de entregadores',
      icon: Users,
      href: `${baseUrl}/entregadores`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Fila de Entregas',
      description: 'Visualize e gerencie entregas em andamento',
      icon: Package,
      href: `${baseUrl}/pedidos?status=delivery`,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Áreas de Entrega',
      description: 'Configure zonas e taxas de entrega',
      icon: MapPin,
      href: `${baseUrl}/areas-entrega`,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Taxas por Bairro',
      description: 'Defina taxas específicas por bairro',
      icon: Route,
      href: `${baseUrl}/taxas-entrega`,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Horários de Entrega',
      description: 'Configure horários disponíveis para delivery',
      icon: Clock,
      href: `${baseUrl}/configuracoes#delivery`,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Rastreamento',
      description: 'Acompanhe entregas em tempo real',
      icon: Truck,
      href: `${baseUrl}/pedidos?view=tracking`,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <DashboardLayout title="Entregas">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deliveryTools.map((tool) => (
          <Link key={tool.title} to={tool.href}>
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
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

export default DeliveryHub;
