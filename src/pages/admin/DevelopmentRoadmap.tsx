import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
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
  LayoutDashboard,
  Bug,
  FileText,
  Server,
  Zap,
  Rocket,
  Target,
  Users,
  Activity,
  Package,
  ChevronRight,
  ChevronLeft
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
  version_phase: string;
  tester_assigned: string | null;
}

type VersionPhase = 'alfa' | 'beta' | 'rc' | 'final' | 'legacy' | 'all';

const STATUS_ORDER = ['backlog', 'in_progress', 'testing', 'done'];

const versionPhases: { key: VersionPhase; title: string; icon: React.ReactNode; color: string }[] = [
  { key: 'all', title: 'Todas as Fases', icon: <LayoutDashboard className="w-4 h-4" />, color: 'bg-primary/10 text-primary border-primary/20' },
  { key: 'alfa', title: 'Alfa v0.9.0', icon: <Bug className="w-4 h-4" />, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { key: 'beta', title: 'Beta v0.95.0', icon: <TestTube className="w-4 h-4" />, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { key: 'rc', title: 'RC v0.99.0', icon: <Target className="w-4 h-4" />, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { key: 'final', title: 'Final v1.0.0', icon: <Rocket className="w-4 h-4" />, color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { key: 'legacy', title: 'Legacy (Concluído)', icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-muted text-muted-foreground border-muted' },
];

const categoryIcons: Record<string, React.ReactNode> = {
  payments: <CreditCard className="w-4 h-4" />,
  reviews: <Star className="w-4 h-4" />,
  support: <Headphones className="w-4 h-4" />,
  whatsapp: <MessageSquare className="w-4 h-4" />,
  delivery: <Truck className="w-4 h-4" />,
  admin: <Shield className="w-4 h-4" />,
  bugfix: <Bug className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  testing: <TestTube className="w-4 h-4" />,
  docs: <FileText className="w-4 h-4" />,
  infra: <Server className="w-4 h-4" />,
  performance: <Zap className="w-4 h-4" />,
  deploy: <Rocket className="w-4 h-4" />,
  monitoring: <Activity className="w-4 h-4" />,
  marketing: <Package className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  payments: 'bg-green-500/10 text-green-500 border-green-500/20',
  reviews: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  support: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  whatsapp: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  delivery: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  admin: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  bugfix: 'bg-red-500/10 text-red-500 border-red-500/20',
  security: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  testing: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  docs: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  infra: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  performance: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  deploy: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  monitoring: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  marketing: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
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
  const [selectedPhase, setSelectedPhase] = useState<VersionPhase>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const advanceStatus = async (itemId: string, currentStatus: string) => {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    if (currentIndex >= STATUS_ORDER.length - 1) return;
    
    const nextStatus = STATUS_ORDER[currentIndex + 1];
    const completion = nextStatus === 'done' ? 100 : (currentIndex + 1) * 33;
    
    setUpdatingId(itemId);
    try {
      const { error } = await supabase
        .from('roadmap_items')
        .update({ 
          status: nextStatus,
          completion_percentage: completion,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);
      
      if (error) throw error;
      
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: nextStatus, completion_percentage: completion }
          : item
      ));
      toast.success(`Avançado para: ${statusColumns.find(c => c.key === nextStatus)?.title}`);
    } catch (error) {
      console.error('Error advancing status:', error);
      toast.error('Erro ao avançar status');
    } finally {
      setUpdatingId(null);
    }
  };

  const revertStatus = async (itemId: string, currentStatus: string) => {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    if (currentIndex <= 0) return;
    
    const prevStatus = STATUS_ORDER[currentIndex - 1];
    const completion = (currentIndex - 1) * 33;
    
    setUpdatingId(itemId);
    try {
      const { error } = await supabase
        .from('roadmap_items')
        .update({ 
          status: prevStatus,
          completion_percentage: completion,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);
      
      if (error) throw error;
      
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: prevStatus, completion_percentage: completion }
          : item
      ));
      toast.success(`Revertido para: ${statusColumns.find(c => c.key === prevStatus)?.title}`);
    } catch (error) {
      console.error('Error reverting status:', error);
      toast.error('Erro ao reverter status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getFilteredItems = () => {
    if (selectedPhase === 'all') return items.filter(i => i.version_phase !== 'legacy');
    return items.filter(item => item.version_phase === selectedPhase);
  };

  const getItemsByStatus = (status: string) => {
    return getFilteredItems().filter(item => item.status === status);
  };

  const getPhaseStats = (phase: VersionPhase) => {
    const phaseItems = phase === 'all' 
      ? items.filter(i => i.version_phase !== 'legacy')
      : items.filter(i => i.version_phase === phase);
    const total = phaseItems.length;
    const done = phaseItems.filter(i => i.status === 'done').length;
    const inProgress = phaseItems.filter(i => i.status === 'in_progress').length;
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, percentage };
  };

  const getCategoryStats = () => {
    const filteredItems = getFilteredItems();
    const stats: Record<string, { total: number; done: number }> = {};
    filteredItems.forEach(item => {
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

  const getTesterStats = () => {
    const betaItems = items.filter(i => i.version_phase === 'beta');
    const tester1 = betaItems.filter(i => i.tester_assigned === 'tester_1');
    const tester2 = betaItems.filter(i => i.tester_assigned === 'tester_2');
    return {
      tester1: { total: tester1.length, done: tester1.filter(i => i.status === 'done').length },
      tester2: { total: tester2.length, done: tester2.filter(i => i.status === 'done').length },
    };
  };

  const categoryStats = getCategoryStats();
  const testerStats = getTesterStats();

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
        {/* Cards de Progresso por Fase */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {versionPhases.filter(p => p.key !== 'all' && p.key !== 'legacy').map(phase => {
            const stats = getPhaseStats(phase.key);
            return (
              <Card 
                key={phase.key}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedPhase === phase.key ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedPhase(phase.key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${phase.color}`}>
                      {phase.icon}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fase</p>
                      <p className="font-semibold text-sm">{phase.title}</p>
                    </div>
                  </div>
                  <Progress value={stats.percentage} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{stats.done}/{stats.total} itens</span>
                    <span className="font-semibold text-foreground">{stats.percentage}%</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs de Navegação */}
        <Tabs value={selectedPhase} onValueChange={(v) => setSelectedPhase(v as VersionPhase)}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
            {versionPhases.map(phase => (
              <TabsTrigger key={phase.key} value={phase.key} className="text-xs">
                {phase.icon}
                <span className="ml-1 hidden sm:inline">{phase.key === 'all' ? 'Todas' : phase.key.toUpperCase()}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {versionPhases.map(phase => (
            <TabsContent key={phase.key} value={phase.key} className="space-y-6">
              {/* Stats do Testador (apenas na fase Beta) */}
              {phase.key === 'beta' && (
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-cyan-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-cyan-500" />
                        <h3 className="font-semibold">Testador 1</h3>
                        <Badge variant="outline" className="ml-auto">Cliente + Admin</Badge>
                      </div>
                      <Progress value={testerStats.tester1.total > 0 ? (testerStats.tester1.done / testerStats.tester1.total) * 100 : 0} className="h-2 mb-1" />
                      <p className="text-xs text-muted-foreground">{testerStats.tester1.done}/{testerStats.tester1.total} testes concluídos</p>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-purple-500" />
                        <h3 className="font-semibold">Testador 2</h3>
                        <Badge variant="outline" className="ml-auto">Lojista + Delivery</Badge>
                      </div>
                      <Progress value={testerStats.tester2.total > 0 ? (testerStats.tester2.done / testerStats.tester2.total) * 100 : 0} className="h-2 mb-1" />
                      <p className="text-xs text-muted-foreground">{testerStats.tester2.done}/{testerStats.tester2.total} testes concluídos</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Stats por categoria */}
              {Object.keys(categoryStats).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Progresso por Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
              )}

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
                    
                    <div className="space-y-2 min-h-[200px] max-h-[500px] overflow-y-auto">
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
                              <div className={`w-2 h-2 rounded-full shrink-0 ${priorityColors[item.priority]}`} />
                            </div>
                            
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${categoryColors[item.category] || ''}`}
                              >
                                {categoryIcons[item.category]}
                                <span className="ml-1 capitalize">{item.category}</span>
                              </Badge>
                              
                              {item.tester_assigned && (
                                <Badge variant="outline" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {item.tester_assigned === 'tester_1' ? 'T1' : 'T2'}
                                </Badge>
                              )}
                              
                              {item.estimated_hours && (
                                <span className="text-xs text-muted-foreground">
                                  {item.estimated_hours}h
                                </span>
                              )}
                            </div>
                            
                            {item.completion_percentage > 0 && item.status !== 'done' && (
                              <Progress value={item.completion_percentage} className="h-1" />
                            )}
                            
                            {/* Botões de Avanço/Retorno */}
                            <div className="flex items-center justify-between pt-1 border-t border-border/50">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                disabled={item.status === 'backlog' || updatingId === item.id}
                                onClick={() => revertStatus(item.id, item.status)}
                              >
                                <ChevronLeft className="w-3 h-3 mr-1" />
                                Voltar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-primary hover:text-primary"
                                disabled={item.status === 'done' || updatingId === item.id}
                                onClick={() => advanceStatus(item.id, item.status)}
                              >
                                Avançar
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
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
            </TabsContent>
          ))}
        </Tabs>

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

        {/* Resumo Total */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-primary" />
                  Progresso para v1.0.0
                </h3>
                <p className="text-sm text-muted-foreground">
                  {items.filter(i => i.version_phase !== 'legacy' && i.status === 'done').length} de {items.filter(i => i.version_phase !== 'legacy').length} itens concluídos
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">
                    {getPhaseStats('all').percentage}%
                  </p>
                  <p className="text-xs text-muted-foreground">Completo</p>
                </div>
                <Progress value={getPhaseStats('all').percentage} className="w-32 h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default DevelopmentRoadmap;
