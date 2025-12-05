import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Database,
  Server,
  Image,
  CreditCard,
  MessageSquare,
  Shield
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface HealthCheck {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  icon: any;
}

const SystemHealthCheck = () => {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runHealthChecks = async () => {
    setIsRunning(true);
    const results: HealthCheck[] = [];

    // 1. Database Connection
    try {
      const { data, error } = await supabase.from('establishments').select('count').limit(1);
      results.push({
        name: 'Conexão com Banco de Dados',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Conectado com sucesso',
        icon: Database
      });
    } catch (e) {
      results.push({
        name: 'Conexão com Banco de Dados',
        status: 'error',
        message: 'Falha na conexão',
        icon: Database
      });
    }

    // 2. Check Establishments
    try {
      const { count, error } = await supabase
        .from('establishments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      results.push({
        name: 'Estabelecimentos Ativos',
        status: error ? 'error' : (count && count > 0 ? 'success' : 'warning'),
        message: error ? error.message : `${count || 0} estabelecimentos ativos`,
        icon: Server
      });
    } catch (e) {
      results.push({
        name: 'Estabelecimentos Ativos',
        status: 'error',
        message: 'Erro ao verificar',
        icon: Server
      });
    }

    // 3. Check Products
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      results.push({
        name: 'Produtos Cadastrados',
        status: error ? 'error' : (count && count > 0 ? 'success' : 'warning'),
        message: error ? error.message : `${count || 0} produtos ativos`,
        icon: Database
      });
    } catch (e) {
      results.push({
        name: 'Produtos Cadastrados',
        status: 'error',
        message: 'Erro ao verificar',
        icon: Database
      });
    }

    // 4. Check Vilas
    try {
      const { count, error } = await supabase
        .from('vilas')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      results.push({
        name: 'Vilas Configuradas',
        status: error ? 'error' : (count && count > 0 ? 'success' : 'warning'),
        message: error ? error.message : `${count || 0} vilas ativas`,
        icon: Server
      });
    } catch (e) {
      results.push({
        name: 'Vilas Configuradas',
        status: 'error',
        message: 'Erro ao verificar',
        icon: Server
      });
    }

    // 5. Check Images (S3/CloudFront)
    try {
      const { data } = await supabase
        .from('products')
        .select('image_url')
        .not('image_url', 'is', null)
        .limit(1)
        .single();
      
      const hasCloudFront = data?.image_url?.includes('cloudfront') || data?.image_url?.includes('s3');
      results.push({
        name: 'Armazenamento de Imagens (S3)',
        status: hasCloudFront ? 'success' : 'warning',
        message: hasCloudFront ? 'CloudFront configurado' : 'Usando storage local',
        icon: Image
      });
    } catch (e) {
      results.push({
        name: 'Armazenamento de Imagens (S3)',
        status: 'warning',
        message: 'Sem imagens para verificar',
        icon: Image
      });
    }

    // 6. Check Payment Integration
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('mercado_pago_token, pix_key')
        .not('mercado_pago_token', 'is', null)
        .limit(1);
      
      const hasPayment = data && data.length > 0;
      results.push({
        name: 'Integração Mercado Pago',
        status: hasPayment ? 'success' : 'warning',
        message: hasPayment ? 'Configurado em estabelecimentos' : 'Nenhum estabelecimento com MP',
        icon: CreditCard
      });
    } catch (e) {
      results.push({
        name: 'Integração Mercado Pago',
        status: 'warning',
        message: 'Não verificado',
        icon: CreditCard
      });
    }

    // 7. Check WhatsApp Integration
    try {
      const { count, error } = await supabase
        .from('whatsapp_instances')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'connected');
      
      results.push({
        name: 'Integração WhatsApp',
        status: error ? 'error' : (count && count > 0 ? 'success' : 'warning'),
        message: error ? error.message : `${count || 0} instâncias conectadas`,
        icon: MessageSquare
      });
    } catch (e) {
      results.push({
        name: 'Integração WhatsApp',
        status: 'warning',
        message: 'Não verificado',
        icon: MessageSquare
      });
    }

    // 8. Check User Roles
    try {
      const { count, error } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin');
      
      results.push({
        name: 'Super Admins Configurados',
        status: error ? 'error' : (count && count > 0 ? 'success' : 'error'),
        message: error ? error.message : `${count || 0} super admins`,
        icon: Shield
      });
    } catch (e) {
      results.push({
        name: 'Super Admins Configurados',
        status: 'error',
        message: 'Erro ao verificar',
        icon: Shield
      });
    }

    // 9. Check Plans
    try {
      const { count, error } = await supabase
        .from('plans')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      results.push({
        name: 'Planos de Assinatura',
        status: error ? 'error' : (count && count > 0 ? 'success' : 'warning'),
        message: error ? error.message : `${count || 0} planos ativos`,
        icon: CreditCard
      });
    } catch (e) {
      results.push({
        name: 'Planos de Assinatura',
        status: 'warning',
        message: 'Não verificado',
        icon: CreditCard
      });
    }

    // 10. Check Recent Orders
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      results.push({
        name: 'Sistema de Pedidos',
        status: error ? 'error' : 'success',
        message: error ? error.message : `${count || 0} pedidos no sistema`,
        icon: Database
      });
    } catch (e) {
      results.push({
        name: 'Sistema de Pedidos',
        status: 'error',
        message: 'Erro ao verificar',
        icon: Database
      });
    }

    setChecks(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-500">OK</Badge>;
      case 'warning': return <Badge className="bg-yellow-500">Atenção</Badge>;
      case 'error': return <Badge variant="destructive">Erro</Badge>;
      default: return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const successCount = checks.filter(c => c.status === 'success').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const errorCount = checks.filter(c => c.status === 'error').length;

  return (
    <AdminLayout title="Verificação de Sistema" icon={Shield} breadcrumb="Health Check">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Verificação de Sistema</h1>
            <p className="text-muted-foreground">Diagnóstico completo para produção</p>
          </div>
          <Button onClick={runHealthChecks} disabled={isRunning}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Verificando...' : 'Executar Verificação'}
          </Button>
        </div>

        {checks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-green-500/10">
                  <p className="text-3xl font-bold text-green-500">{successCount}</p>
                  <p className="text-sm text-muted-foreground">Sucesso</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10">
                  <p className="text-3xl font-bold text-yellow-500">{warningCount}</p>
                  <p className="text-sm text-muted-foreground">Atenção</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10">
                  <p className="text-3xl font-bold text-red-500">{errorCount}</p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checks.map((check, index) => {
            const Icon = check.icon;
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        check.status === 'success' ? 'bg-green-500/10' :
                        check.status === 'warning' ? 'bg-yellow-500/10' :
                        check.status === 'error' ? 'bg-red-500/10' : 'bg-muted'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          check.status === 'success' ? 'text-green-500' :
                          check.status === 'warning' ? 'text-yellow-500' :
                          check.status === 'error' ? 'text-red-500' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{check.name}</p>
                        <p className="text-sm text-muted-foreground">{check.message}</p>
                      </div>
                    </div>
                    {getStatusIcon(check.status)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {checks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Clique em "Executar Verificação" para iniciar o diagnóstico do sistema
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default SystemHealthCheck;
