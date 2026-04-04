import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp, BarChart3, LineChart, PieChart, Sparkles } from 'lucide-react';

const IntelligenceHub = () => {
  const { slug } = useParams();
  const baseUrl = `/painel/${slug}`;

  const intelligenceTools = [
    {
      title: 'Análise com IA',
      description: 'Receba insights e recomendações da inteligência artificial',
      icon: Brain,
      href: `${baseUrl}/analise-ia`,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Curva ABC',
      description: 'Análise de rentabilidade e classificação de produtos',
      icon: TrendingUp,
      href: `${baseUrl}/curva-abc`,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'DRE Automatizada',
      description: 'Demonstrativo de resultados do exercício',
      icon: BarChart3,
      href: `${baseUrl}/dre`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Relatórios',
      description: 'Visualize relatórios detalhados de vendas e operações',
      icon: LineChart,
      href: `${baseUrl}/relatorios`,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Pixels e Analytics',
      description: 'Configure Facebook Pixel, Google Analytics e TikTok',
      icon: PieChart,
      href: `${baseUrl}/pixels`,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Recomendações IA (Em breve)',
      description: 'Sugestões automáticas de preços e promoções',
      icon: Sparkles,
      href: '#',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50',
      disabled: true,
    },
  ];

  return (
    <DashboardLayout title="Inteligência">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {intelligenceTools.map((tool) => (
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

export default IntelligenceHub;
