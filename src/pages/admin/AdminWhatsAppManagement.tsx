import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  Bot, 
  Activity, 
  Settings, 
  Send,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  status: string;
  whatsapp_level: number;
  ai_enabled: boolean;
  keywords_enabled: boolean;
  establishment_id: string;
  establishments?: {
    name: string;
    slug: string;
  };
}

interface GlobalStats {
  totalInstances: number;
  connectedInstances: number;
  totalMessages: number;
  totalSessions: number;
  aiEnabledCount: number;
}

const AdminWhatsAppManagement = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [stats, setStats] = useState<GlobalStats>({
    totalInstances: 0,
    connectedInstances: 0,
    totalMessages: 0,
    totalSessions: 0,
    aiEnabledCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all WhatsApp instances with establishment info
      const { data: instancesData, error: instancesError } = await supabase
        .from('whatsapp_instances')
        .select('*, establishments(name, slug)')
        .order('created_at', { ascending: false });

      if (instancesError) throw instancesError;
      setInstances(instancesData || []);

      // Calculate stats
      const connected = instancesData?.filter(i => i.status === 'connected').length || 0;
      const aiEnabled = instancesData?.filter(i => i.ai_enabled).length || 0;

      // Get message and session counts
      const { count: messagesCount } = await supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true });

      const { count: sessionsCount } = await supabase
        .from('whatsapp_sessions')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalInstances: instancesData?.length || 0,
        connectedInstances: connected,
        totalMessages: messagesCount || 0,
        totalSessions: sessionsCount || 0,
        aiEnabledCount: aiEnabled
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const toggleAI = async (instanceId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ ai_enabled: enabled })
        .eq('id', instanceId);

      if (error) throw error;
      
      setInstances(prev => prev.map(i => 
        i.id === instanceId ? { ...i, ai_enabled: enabled } : i
      ));
      toast.success(enabled ? 'IA ativada' : 'IA desativada');
    } catch (error) {
      console.error('Error toggling AI:', error);
      toast.error('Erro ao atualizar');
    }
  };

  const toggleKeywords = async (instanceId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ keywords_enabled: enabled })
        .eq('id', instanceId);

      if (error) throw error;
      
      setInstances(prev => prev.map(i => 
        i.id === instanceId ? { ...i, keywords_enabled: enabled } : i
      ));
      toast.success(enabled ? 'Chatbot ativado' : 'Chatbot desativado');
    } catch (error) {
      console.error('Error toggling keywords:', error);
      toast.error('Erro ao atualizar');
    }
  };

  const updateLevel = async (instanceId: string, level: number) => {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ whatsapp_level: level })
        .eq('id', instanceId);

      if (error) throw error;
      
      setInstances(prev => prev.map(i => 
        i.id === instanceId ? { ...i, whatsapp_level: level } : i
      ));
      toast.success(`Nível atualizado para ${level}`);
    } catch (error) {
      console.error('Error updating level:', error);
      toast.error('Erro ao atualizar');
    }
  };

  const filteredInstances = instances.filter(i => 
    i.instance_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.establishments?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Conectado</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Conectando</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-700"><AlertCircle className="h-3 w-3 mr-1" />Desconectado</Badge>;
    }
  };

  return (
    <AdminLayout title="WhatsApp Global" breadcrumb="WhatsApp Global">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Instâncias</p>
                <p className="text-xl font-bold">{stats.totalInstances}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conectadas</p>
                <p className="text-xl font-bold">{stats.connectedInstances}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sessões</p>
                <p className="text-xl font-bold">{stats.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Send className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mensagens</p>
                <p className="text-xl font-bold">{stats.totalMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Bot className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Com IA</p>
                <p className="text-xl font-bold">{stats.aiEnabledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="instances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="instances">Instâncias</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="instances">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Instâncias WhatsApp
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : filteredInstances.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhuma instância WhatsApp configurada
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estabelecimento</TableHead>
                        <TableHead>Instância</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Chatbot</TableHead>
                        <TableHead>Agente IA</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInstances.map((instance) => (
                        <TableRow key={instance.id}>
                          <TableCell className="font-medium">
                            {instance.establishments?.name || 'N/A'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {instance.instance_name}
                          </TableCell>
                          <TableCell>{getStatusBadge(instance.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant={instance.whatsapp_level === 1 ? 'default' : 'outline'}
                                onClick={() => updateLevel(instance.id, 1)}
                                className="h-7 px-2"
                              >
                                T1
                              </Button>
                              <Button
                                size="sm"
                                variant={instance.whatsapp_level === 2 ? 'default' : 'outline'}
                                onClick={() => updateLevel(instance.id, 2)}
                                className="h-7 px-2"
                              >
                                T2
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={instance.keywords_enabled !== false}
                              onCheckedChange={(checked) => toggleKeywords(instance.id, checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={instance.ai_enabled === true}
                              onCheckedChange={(checked) => toggleAI(instance.id, checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/painel/${instance.establishments?.slug}/whatsapp`, '_blank')}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Mensagens em Massa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Funcionalidade de broadcast para enviar mensagens para múltiplos estabelecimentos.
                Em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Templates Globais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Templates de mensagem padrão para todos os estabelecimentos.
                Em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminWhatsAppManagement;
