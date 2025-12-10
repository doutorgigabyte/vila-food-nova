import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { 
  Menu, 
  Database, 
  Trash2, 
  RefreshCw,
  AlertTriangle,
  Store,
  Package,
  Video,
  ShoppingCart,
  Users,
  MessageSquare,
  Loader2,
  CheckCircle2
} from "lucide-react";

interface TableStats {
  name: string;
  count: number;
  icon: React.ReactNode;
  description: string;
  canClear: boolean;
}

const DatabaseManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TableStats[]>([]);
  const [clearing, setClearing] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [
        establishments,
        products,
        videos,
        orders,
        customers,
        categories
      ] = await Promise.all([
        supabase.from('establishments').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('establishment_videos').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
      ]);

      setStats([
        { 
          name: 'establishments', 
          count: establishments.count || 0, 
          icon: <Store className="w-5 h-5" />,
          description: 'Lojas e estabelecimentos',
          canClear: true
        },
        { 
          name: 'products', 
          count: products.count || 0, 
          icon: <Package className="w-5 h-5" />,
          description: 'Produtos cadastrados',
          canClear: true
        },
        { 
          name: 'establishment_videos', 
          count: videos.count || 0, 
          icon: <Video className="w-5 h-5" />,
          description: 'Stories / VilaTok',
          canClear: true
        },
        { 
          name: 'orders', 
          count: orders.count || 0, 
          icon: <ShoppingCart className="w-5 h-5" />,
          description: 'Pedidos realizados',
          canClear: true
        },
        { 
          name: 'customers', 
          count: customers.count || 0, 
          icon: <Users className="w-5 h-5" />,
          description: 'Clientes cadastrados',
          canClear: true
        },
        { 
          name: 'categories', 
          count: categories.count || 0, 
          icon: <MessageSquare className="w-5 h-5" />,
          description: 'Categorias de produtos',
          canClear: true
        },
      ]);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const clearTable = async (tableName: string) => {
    setClearing(tableName);
    try {
      // Due to foreign key constraints, we need to clear in order
      if (tableName === 'establishments') {
        // Clear dependent tables first
        await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('establishment_videos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('coupons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('delivery_fees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('delivery_zones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('establishments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } else if (tableName === 'products') {
        await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } else if (tableName === 'establishment_videos') {
        await supabase.from('establishment_videos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } else if (tableName === 'orders') {
        await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } else if (tableName === 'customers') {
        await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } else if (tableName === 'categories') {
        await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      toast.success(`Tabela ${tableName} limpa com sucesso!`);
      loadStats();
    } catch (error) {
      console.error('Error clearing table:', error);
      toast.error(`Erro ao limpar tabela ${tableName}`);
    } finally {
      setClearing(null);
    }
  };

  const clearAllData = async () => {
    setClearing('all');
    try {
      // Clear in order of dependencies
      toast.info('Limpando pedidos...');
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      toast.info('Limpando clientes...');
      await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      toast.info('Limpando vídeos...');
      await supabase.from('establishment_videos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      toast.info('Limpando produtos...');
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      toast.info('Limpando categorias...');
      await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      toast.info('Limpando banners...');
      await supabase.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      toast.info('Limpando cupons...');
      await supabase.from('coupons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      toast.info('Limpando taxas de entrega...');
      await supabase.from('delivery_fees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      toast.info('Limpando zonas de entrega...');
      await supabase.from('delivery_zones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      toast.info('Limpando estabelecimentos...');
      await supabase.from('establishments').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      toast.success('Todos os dados foram limpos com sucesso!');
      loadStats();
    } catch (error) {
      console.error('Error clearing all data:', error);
      toast.error('Erro ao limpar todos os dados');
    } finally {
      setClearing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className="flex-1 lg:ml-64 overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Database className="w-5 h-5 shrink-0" />
                  <span className="truncate">Gestão do Banco de Dados</span>
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  Limpe dados de teste para adicionar lojas reais
                </p>
              </div>
            </div>
            <Button onClick={loadStats} variant="outline" disabled={loading} className="shrink-0">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
              Esta página permite excluir dados do banco de dados. Essas ações são <strong>irreversíveis</strong>. 
              Use apenas quando estiver pronto para substituir dados de teste por dados reais.
            </AlertDescription>
          </Alert>

          {/* Stats Cards */}
          {stats.length === 0 && !loading && (
            <div className="text-center py-12">
              <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Carregue as estatísticas</h3>
              <p className="text-muted-foreground mb-4">
                Clique em "Atualizar" para ver os dados do banco
              </p>
              <Button onClick={loadStats}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Carregar Estatísticas
              </Button>
            </div>
          )}

          {loading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {stats.length > 0 && !loading && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((table) => (
                  <Card key={table.name}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {table.icon}
                        {table.name}
                      </CardTitle>
                      <CardDescription>{table.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {table.count} registros
                      </Badge>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={clearing !== null || table.count === 0}
                          >
                            {clearing === table.name ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Limpar {table.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação vai excluir todos os {table.count} registros da tabela {table.name}.
                              {table.name === 'establishments' && (
                                <span className="block mt-2 text-destructive font-medium">
                                  ⚠️ Isso também excluirá produtos, categorias, vídeos e outros dados relacionados!
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => clearTable(table.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Sim, excluir tudo
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Clear All Button */}
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Limpar Todos os Dados
                  </CardTitle>
                  <CardDescription>
                    Remove todos os dados de teste para começar do zero com lojas reais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="lg"
                        disabled={clearing !== null}
                        className="w-full md:w-auto"
                      >
                        {clearing === 'all' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Limpando...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Limpar TODOS os Dados
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Limpar TODOS os dados?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>Esta ação vai excluir:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Todos os estabelecimentos</li>
                            <li>Todos os produtos</li>
                            <li>Todas as categorias</li>
                            <li>Todos os vídeos/stories</li>
                            <li>Todos os pedidos</li>
                            <li>Todos os clientes</li>
                            <li>Todos os cupons</li>
                            <li>Todas as configurações de entrega</li>
                          </ul>
                          <p className="text-destructive font-medium pt-2">
                            ⚠️ Esta ação é IRREVERSÍVEL!
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={clearAllData}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sim, excluir TUDO
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>

              {/* Success Info */}
              <Card className="bg-green-500/10 border-green-500/30">
                <CardHeader>
                  <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Próximos Passos
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p>Após limpar os dados de teste, você pode:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Cadastrar estabelecimentos reais em <strong>Estabelecimentos</strong></li>
                    <li>Adicionar produtos reais para cada loja</li>
                    <li>Configurar taxas de entrega e áreas de cobertura</li>
                    <li>Vincular contas do Mercado Pago dos estabelecimentos</li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DatabaseManagement;
