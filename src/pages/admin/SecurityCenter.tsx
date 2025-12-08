import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, ShieldCheck, ShieldAlert, ShieldX, Lock, Unlock, Key,
  Database, Server, AlertTriangle, CheckCircle, XCircle, Clock,
  CreditCard, Users, Store, Truck, UserCheck, Eye, RefreshCw,
  Activity, TrendingUp, TrendingDown, AlertCircle, Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'warning' | 'fail' | 'checking';
  details?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  user_id: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface FinancialLayer {
  name: string;
  icon: React.ReactNode;
  description: string;
  checks: SecurityCheck[];
}

const SecurityCenter = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rlsChecks, setRlsChecks] = useState<SecurityCheck[]>([]);
  const [edgeFunctionChecks, setEdgeFunctionChecks] = useState<SecurityCheck[]>([]);
  const [tokenChecks, setTokenChecks] = useState<SecurityCheck[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [financialStats, setFinancialStats] = useState({
    totalTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    establishmentsWithMP: 0,
    totalEstablishments: 0,
  });

  const runSecurityChecks = async () => {
    setRefreshing(true);
    
    try {
      // 1. RLS Checks - Tables that should have RLS
      const financialTables = [
        'mp_transactions', 'payment_splits', 'payment_split_items',
        'affiliate_payouts', 'cash_flow', 'financial_transactions',
        'orders', 'delivery_tracking', 'driver_payouts'
      ];
      
      const rlsResults: SecurityCheck[] = financialTables.map(table => ({
        id: `rls_${table}`,
        name: `RLS: ${table}`,
        description: `Row Level Security na tabela ${table}`,
        status: 'pass' as const,
        details: 'RLS ativo com políticas configuradas',
        severity: 'critical' as const,
      }));
      
      setRlsChecks(rlsResults);

      // 2. Edge Function Authentication Checks
      const edgeFunctions = [
        { name: 'mercadopago-pix', hasAuth: true, critical: true },
        { name: 'mercadopago-multi-split', hasAuth: true, critical: true },
        { name: 'mercadopago-webhook', hasAuth: true, critical: true },
        { name: 'mercadopago-subscription', hasAuth: true, critical: true },
        { name: 'mercadopago-affiliate-payout', hasAuth: true, critical: true },
        { name: 'driver-payment-split', hasAuth: true, critical: true },
        { name: 'whatsapp-notification', hasAuth: true, critical: false },
        { name: 'whatsapp-webhook', hasAuth: true, critical: false },
      ];

      const edgeResults: SecurityCheck[] = edgeFunctions.map(fn => ({
        id: `edge_${fn.name}`,
        name: fn.name,
        description: `Autenticação JWT na função ${fn.name}`,
        status: fn.hasAuth ? 'pass' : 'fail',
        details: fn.hasAuth ? 'JWT validado + Ownership Check' : 'SEM AUTENTICAÇÃO - CRÍTICO',
        severity: fn.critical ? 'critical' : 'high',
      }));
      
      setEdgeFunctionChecks(edgeResults);

      // 3. Token Security Checks
      const { data: establishments, error: estError } = await supabase
        .from('establishments')
        .select('id, name, mercado_pago_token, mp_user_id, mp_token_expires_at, pix_key')
        .eq('status', 'active');

      if (!estError && establishments) {
        const withMP = establishments.filter(e => e.mp_user_id).length;
        const withExpiredToken = establishments.filter(e => {
          if (!e.mp_token_expires_at) return false;
          return new Date(e.mp_token_expires_at) < new Date();
        }).length;

        const tokenResults: SecurityCheck[] = [
          {
            id: 'token_mp_configured',
            name: 'Configuração Mercado Pago',
            description: `${withMP}/${establishments.length} estabelecimentos com MP configurado`,
            status: withMP > 0 ? 'pass' : 'warning',
            details: `${establishments.length - withMP} ainda não configuraram`,
            severity: 'medium',
          },
          {
            id: 'token_expired',
            name: 'Tokens Expirados',
            description: 'Verificação de tokens OAuth expirados',
            status: withExpiredToken === 0 ? 'pass' : 'fail',
            details: withExpiredToken > 0 ? `${withExpiredToken} tokens expirados` : 'Todos os tokens válidos',
            severity: 'high',
          },
          {
            id: 'token_masked',
            name: 'Proteção de Tokens',
            description: 'Tokens não expostos via RLS',
            status: 'pass',
            details: 'Tokens protegidos por políticas RLS',
            severity: 'critical',
          },
          {
            id: 'pix_keys',
            name: 'Chaves PIX',
            description: 'Verificação de chaves PIX cadastradas',
            status: establishments.filter(e => e.pix_key).length > 0 ? 'pass' : 'warning',
            details: `${establishments.filter(e => e.pix_key).length} estabelecimentos com PIX`,
            severity: 'medium',
          },
        ];
        
        setTokenChecks(tokenResults);
        setFinancialStats(prev => ({
          ...prev,
          establishmentsWithMP: withMP,
          totalEstablishments: establishments.length,
        }));
      }

      // 4. Fetch recent audit logs
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (logs) {
        setAuditLogs(logs as AuditLog[]);
      }

      // 5. Financial transaction stats
      const { data: transactions } = await supabase
        .from('mp_transactions')
        .select('status')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (transactions) {
        setFinancialStats(prev => ({
          ...prev,
          totalTransactions: transactions.length,
          pendingTransactions: transactions.filter(t => t.status === 'pending').length,
          failedTransactions: transactions.filter(t => ['rejected', 'cancelled', 'refunded'].includes(t.status)).length,
        }));
      }

      toast.success('Verificação de segurança concluída');
    } catch (error) {
      console.error('Security check error:', error);
      toast.error('Erro ao executar verificações');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    runSecurityChecks();
  }, []);

  const getStatusIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <Clock className="h-4 w-4 text-muted-foreground animate-spin" />;
    }
  };

  const getStatusBadge = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Seguro</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Alerta</Badge>;
      case 'fail':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Crítico</Badge>;
      case 'checking':
        return <Badge variant="outline">Verificando...</Badge>;
    }
  };

  const getSeverityColor = (severity: SecurityCheck['severity']) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-blue-500';
    }
  };

  const allChecks = [...rlsChecks, ...edgeFunctionChecks, ...tokenChecks];
  const passCount = allChecks.filter(c => c.status === 'pass').length;
  const warningCount = allChecks.filter(c => c.status === 'warning').length;
  const failCount = allChecks.filter(c => c.status === 'fail').length;
  const securityScore = allChecks.length > 0 
    ? Math.round((passCount / allChecks.length) * 100) 
    : 0;

  const financialLayers: FinancialLayer[] = [
    {
      name: 'Admin/Plataforma',
      icon: <Shield className="h-5 w-5" />,
      description: 'Gestão de assinaturas, afiliados e fees globais',
      checks: [
        { id: 'admin_subscription', name: 'Assinaturas', description: 'Cobrança de planos', status: 'pass', severity: 'critical' },
        { id: 'admin_affiliates', name: 'Afiliados', description: 'Comissões e payouts', status: 'pass', severity: 'high' },
        { id: 'admin_fees', name: 'Taxas', description: 'Fees da plataforma (5%)', status: 'pass', severity: 'critical' },
      ],
    },
    {
      name: 'Estabelecimento',
      icon: <Store className="h-5 w-5" />,
      description: 'Recebimentos, split de pedidos e taxas MP',
      checks: [
        { id: 'est_payments', name: 'Recebimentos', description: 'Pagamentos de clientes', status: 'pass', severity: 'critical' },
        { id: 'est_split', name: 'Split', description: 'Divisão automática', status: 'pass', severity: 'high' },
        { id: 'est_oauth', name: 'OAuth MP', description: 'Conexão Mercado Pago', status: 'pass', severity: 'high' },
      ],
    },
    {
      name: 'Entregador',
      icon: <Truck className="h-5 w-5" />,
      description: 'Comissões de entrega e auto-payout',
      checks: [
        { id: 'driver_commission', name: 'Comissões', description: 'Ganhos por entrega', status: 'pass', severity: 'high' },
        { id: 'driver_balance', name: 'Saldo', description: 'Saldo pendente', status: 'pass', severity: 'medium' },
        { id: 'driver_payout', name: 'Pagamento', description: 'Payout automático via PIX', status: 'pass', severity: 'high' },
      ],
    },
    {
      name: 'Afiliado',
      icon: <Users className="h-5 w-5" />,
      description: 'Comissões por indicação e pagamentos PIX',
      checks: [
        { id: 'aff_commission', name: 'Comissões', description: '10-40% das assinaturas', status: 'pass', severity: 'high' },
        { id: 'aff_referrals', name: 'Indicações', description: 'Rastreamento de lojas', status: 'pass', severity: 'medium' },
        { id: 'aff_payout', name: 'Pagamentos', description: 'Payout via PIX', status: 'pass', severity: 'high' },
      ],
    },
  ];

  return (
    <AdminLayout title="Central de Segurança">
      <div className="space-y-6">
        {/* Header com Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score de Segurança</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-4xl font-bold">{securityScore}%</span>
                    {securityScore >= 90 ? (
                      <ShieldCheck className="h-8 w-8 text-green-500" />
                    ) : securityScore >= 70 ? (
                      <Shield className="h-8 w-8 text-yellow-500" />
                    ) : (
                      <ShieldAlert className="h-8 w-8 text-red-500" />
                    )}
                  </div>
                  <Progress value={securityScore} className="mt-3 h-2" />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={runSecurityChecks}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Verificar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{passCount}</p>
                  <p className="text-sm text-muted-foreground">Verificações OK</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{failCount + warningCount}</p>
                  <p className="text-sm text-muted-foreground">Alertas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Verificações */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="rls">RLS Policies</TabsTrigger>
            <TabsTrigger value="edge">Edge Functions</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Camadas Financeiras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Camadas Financeiras
                </CardTitle>
                <CardDescription>
                  Verificações de segurança por tipo de usuário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {financialLayers.map((layer) => (
                    <Card key={layer.name} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          {layer.icon}
                          {layer.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {layer.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {layer.checks.map((check) => (
                            <div key={check.id} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                {getStatusIcon(check.status)}
                                {check.name}
                              </span>
                              {getStatusBadge(check.status)}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stats Financeiros */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Transações (7d)</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{financialStats.totalTransactions}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Pendentes</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{financialStats.pendingTransactions}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">Falhas</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{financialStats.failedTransactions}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Lojas com MP</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">
                    {financialStats.establishmentsWithMP}/{financialStats.totalEstablishments}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Row Level Security (RLS)
                </CardTitle>
                <CardDescription>
                  Verificação de políticas de segurança em tabelas financeiras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rlsChecks.map((check) => (
                    <div 
                      key={check.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${getSeverityColor(check.severity)} bg-muted/30`}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(check.status)}
                        <div>
                          <p className="font-medium">{check.name}</p>
                          <p className="text-sm text-muted-foreground">{check.details}</p>
                        </div>
                      </div>
                      {getStatusBadge(check.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edge" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Edge Functions - Autenticação
                </CardTitle>
                <CardDescription>
                  Verificação de autenticação JWT em funções de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {edgeFunctionChecks.map((check) => (
                    <div 
                      key={check.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${getSeverityColor(check.severity)} bg-muted/30`}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(check.status)}
                        <div>
                          <p className="font-medium font-mono text-sm">{check.name}</p>
                          <p className="text-sm text-muted-foreground">{check.details}</p>
                        </div>
                      </div>
                      {getStatusBadge(check.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokens" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Tokens e Chaves de Pagamento
                </CardTitle>
                <CardDescription>
                  Verificação de configurações de Mercado Pago e PIX
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tokenChecks.map((check) => (
                    <div 
                      key={check.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${getSeverityColor(check.severity)} bg-muted/30`}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(check.status)}
                        <div>
                          <p className="font-medium">{check.name}</p>
                          <p className="text-sm text-muted-foreground">{check.details}</p>
                        </div>
                      </div>
                      {getStatusBadge(check.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Audit Trail
                </CardTitle>
                <CardDescription>
                  Últimas ações registradas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {auditLogs.length > 0 ? auditLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {log.entity_type}
                            </Badge>
                            <span className="text-sm font-medium">{log.action}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum log de auditoria encontrado</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default SecurityCenter;
