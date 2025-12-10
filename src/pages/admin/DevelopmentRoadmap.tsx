import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  TestTube,
  CreditCard,
  Star,
  Headphones,
  MessageSquare,
  Truck,
  Shield,
  LayoutDashboard
} from 'lucide-react';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  estimated_hours: number;
  completion_percentage: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
  payments: <CreditCard className="w-4 h-4" />,
  reviews: <Star className="w-4 h-4" />,
  support: <Headphones className="w-4 h-4" />,
  whatsapp: <MessageSquare className="w-4 h-4" />,
  delivery: <Truck className="w-4 h-4" />,
  admin: <Shield className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  payments: 'bg-green-500/10 text-green-500 border-green-500/20',
  reviews: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  support: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  whatsapp: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  delivery: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  admin: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

const priorityColors: Record<string, string> = {
  P1: 'bg-red-500',
  P2: 'bg-orange-500',
  P3: 'bg-yellow-500',
  P4: 'bg-blue-500',
  P5: 'bg-gray-500',
};

const statusColumns = [
  { key: 'backlog', title: 'Backlog', icon: <Circle className="w-4 h-4" /> },
  { key: 'in_progress', title: 'Em Progresso', icon: <Clock className="w-4 h-4" /> },
  { key: 'testing', title: 'Em Teste', icon: <TestTube className="w-4 h-4" /> },
  { key: 'done', title: 'Concluído', icon: <CheckCircle2 className="w-4 h-4" /> },
];

const DevelopmentRoadmap = () => {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('roadmap_items')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemsByStatus = (status: string) => {
    return items.filter(item => item.status === status);
  };

  const calculateOverallProgress = () => {
    if (items.length === 0) return 0;
    const totalCompletion = items.reduce((acc, item) => acc + item.completion_percentage, 0);
    return Math.round(totalCompletion / items.length);
  };

  const getCategoryStats = () => {
    const stats: Record<string, { total: number; done: number }> = {};
    items.forEach(item => {
      if (!stats[item.category]) {
        stats[item.category] = { total: 0, done: 0 };
      }
      stats[item.category].total++;
      if (item.status === 'done') {
        stats[item.category].done++;
      }
    });
    return stats;
  };

  const categoryStats = getCategoryStats();
  const overallProgress = calculateOverallProgress();

  if (loading) {
    return (
      <AdminLayout title="Roadmap de Desenvolvimento">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Roadmap de Desenvolvimento">
      <div className="space-y-6">
        {/* Progresso Geral */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5" />
                Progresso Geral
              </CardTitle>
              <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-3 mb-4" />
            
            {/* Stats por categoria */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div 
                  key={category}
                  className={`p-3 rounded-lg border ${categoryColors[category] || 'bg-muted'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {categoryIcons[category]}
                    <span className="text-xs font-medium capitalize">{category}</span>
                  </div>
                  <p className="text-lg font-bold">{stats.done}/{stats.total}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map(column => (
            <div key={column.key} className="space-y-3">
              <div className="flex items-center gap-2 px-2 py-1">
                {column.icon}
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {getItemsByStatus(column.key).length}
                </Badge>
              </div>
              
              <div className="space-y-2 min-h-[200px]">
                {getItemsByStatus(column.key).map(item => (
                  <Card 
                    key={item.id} 
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight">
                          {item.title}
                        </h4>
                        <div className={`w-2 h-2 rounded-full ${priorityColors[item.priority]}`} />
                      </div>
                      
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${categoryColors[item.category] || ''}`}
                        >
                          {categoryIcons[item.category]}
                          <span className="ml-1 capitalize">{item.category}</span>
                        </Badge>
                        
                        {item.estimated_hours && (
                          <span className="text-xs text-muted-foreground">
                            {item.estimated_hours}h
                          </span>
                        )}
                      </div>
                      
                      {item.completion_percentage > 0 && item.status !== 'done' && (
                        <Progress value={item.completion_percentage} className="h-1" />
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {getItemsByStatus(column.key).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum item
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legenda */}
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-medium">Prioridade:</span>
              {Object.entries(priorityColors).map(([priority, color]) => (
                <div key={priority} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span>{priority}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default DevelopmentRoadmap;
