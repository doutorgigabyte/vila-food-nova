import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Database, CheckCircle, AlertCircle, Users, Image, Link2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MigrationStatus {
  segments: number;
  plans: number;
  states: number;
  establishments: number;
  categories: number;
  products: number;
}

interface SyncResult {
  email?: string;
  slug?: string;
  status: string;
  error?: string;
}

export default function DataMigration() {
  const [loading, setLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [adminCreated, setAdminCreated] = useState(false);
  const [syncResults, setSyncResults] = useState<{
    users?: SyncResult[];
    links?: SyncResult[];
    images?: SyncResult[];
  } | null>(null);

  const runMigration = async (action: string, data?: any) => {
    setLoading(action);
    try {
      const { data: result, error } = await supabase.functions.invoke('migrate-legacy-data', {
        body: { action, data }
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error);

      toast.success(`${action} executado com sucesso!`);
      await fetchStatus();
      return result;
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const runUserSync = async (action: string) => {
    setLoading(action);
    try {
      const { data: result, error } = await supabase.functions.invoke('sync-legacy-users', {
        body: { action }
      });

      if (error) throw error;
      
      if (action === 'create_users') {
        setSyncResults(prev => ({ ...prev, users: result.results }));
        toast.success(`${result.results?.length || 0} usuários processados`);
      } else if (action === 'link_establishments') {
        setSyncResults(prev => ({ ...prev, links: result.results }));
        toast.success(`${result.results?.length || 0} estabelecimentos vinculados`);
      } else if (action === 'sync_images') {
        setSyncResults(prev => ({ ...prev, images: result.results }));
        toast.success(`${result.results?.length || 0} imagens sincronizadas`);
      } else if (action === 'full_sync') {
        setSyncResults({
          users: result.users?.results,
          links: result.links?.results,
          images: result.images?.results
        });
        toast.success('Sincronização completa realizada!');
      }
      
      return result;
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const fetchStatus = async () => {
    try {
      const { data: result, error } = await supabase.functions.invoke('migrate-legacy-data', {
        body: { action: 'get_migration_status' }
      });
      
      if (!error && result.success) {
        setStatus(result.counts);
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  };

  const createAdminUser = async () => {
    const result = await runMigration('create_admin_user', {
      email: 'admin@admin.com.br',
      password: 'admin123',
      full_name: 'Administrador'
    });
    
    if (result?.success) {
      setAdminCreated(true);
    }
  };

  const runAllBaseMigrations = async () => {
    setLoading('all');
    try {
      await runMigration('migrate_segments');
      await runMigration('migrate_plans');
      await runMigration('migrate_states');
      toast.success('Migração base concluída!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'created':
      case 'linked':
      case 'synced':
        return <Badge className="bg-green-500">Sucesso</Badge>;
      case 'already_exists':
        return <Badge variant="secondary">Já existe</Badge>;
      case 'user_not_found':
        return <Badge variant="outline">Usuário não encontrado</Badge>;
      case 'error':
      case 'exception':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Migração de Dados</h1>
      </div>
      
      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Status do Banco de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatusItem label="Segmentos" count={status.segments} />
              <StatusItem label="Planos" count={status.plans} />
              <StatusItem label="Estados" count={status.states} />
              <StatusItem label="Estabelecimentos" count={status.establishments} />
              <StatusItem label="Categorias" count={status.categories} />
              <StatusItem label="Produtos" count={status.products} />
            </div>
          ) : (
            <Button onClick={fetchStatus} variant="outline">
              Carregar Status
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Legacy Users Sync */}
      <Card className="mb-6 border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Sincronização de Usuários Legados
          </CardTitle>
          <CardDescription>
            Sincroniza usuários, vincula estabelecimentos e atualiza imagens do sistema legado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => runUserSync('full_sync')}
            disabled={loading !== null}
            className="w-full"
            size="lg"
          >
            {loading === 'full_sync' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            🚀 Executar Sincronização Completa
          </Button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => runUserSync('create_users')}
              disabled={loading !== null}
              variant="outline"
            >
              {loading === 'create_users' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Users className="mr-2 h-4 w-4" />
              Criar Usuários
            </Button>
            
            <Button 
              onClick={() => runUserSync('link_establishments')}
              disabled={loading !== null}
              variant="outline"
            >
              {loading === 'link_establishments' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Link2 className="mr-2 h-4 w-4" />
              Vincular Estab.
            </Button>
            
            <Button 
              onClick={() => runUserSync('sync_images')}
              disabled={loading !== null}
              variant="outline"
            >
              {loading === 'sync_images' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Image className="mr-2 h-4 w-4" />
              Sincronizar Imagens
            </Button>
          </div>

          {/* Sync Results */}
          {syncResults && (
            <div className="mt-4 space-y-4">
              {syncResults.users && syncResults.users.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Usuários ({syncResults.users.length})</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                    {syncResults.users.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>{r.email}</span>
                        {getStatusBadge(r.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {syncResults.links && syncResults.links.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Vínculos ({syncResults.links.length})</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                    {syncResults.links.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>{r.email} → {r.slug}</span>
                        {getStatusBadge(r.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {syncResults.images && syncResults.images.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Imagens ({syncResults.images.length})</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                    {syncResults.images.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>{r.slug}</span>
                        {getStatusBadge(r.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-4 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">Senha padrão para usuários migrados:</p>
            <code className="bg-background px-2 py-1 rounded">vilafood2025</code>
          </div>
        </CardContent>
      </Card>

      {/* Migration Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Migração Base</CardTitle>
          <CardDescription>
            Executa a migração dos dados fundamentais (segmentos, planos e estados)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runAllBaseMigrations}
            disabled={loading !== null}
            className="w-full"
          >
            {loading === 'all' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Executar Migração Base Completa
          </Button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => runMigration('migrate_segments')}
              disabled={loading !== null}
              variant="outline"
            >
              {loading === 'migrate_segments' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Migrar Segmentos
            </Button>
            
            <Button 
              onClick={() => runMigration('migrate_plans')}
              disabled={loading !== null}
              variant="outline"
            >
              {loading === 'migrate_plans' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Migrar Planos
            </Button>
            
            <Button 
              onClick={() => runMigration('migrate_states')}
              disabled={loading !== null}
              variant="outline"
            >
              {loading === 'migrate_states' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Migrar Estados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin User Creation */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Criar Usuário Admin</CardTitle>
          <CardDescription>
            Cria o usuário admin@admin.com.br com senha admin123
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminCreated ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Usuário admin criado com sucesso!</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Atenção:</strong> Este usuário usa credenciais fracas (admin123) e deve ser usado apenas para testes.
                </div>
              </div>
              
              <Button 
                onClick={createAdminUser}
                disabled={loading !== null}
              >
                {loading === 'create_admin_user' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Usuário Admin
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusItem({ label, count }: { label: string; count: number }) {
  return (
    <div className="p-3 bg-muted rounded-lg">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{count}</div>
    </div>
  );
}