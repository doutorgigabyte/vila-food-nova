import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Users, Database, Lock, Key, FileText, 
  AlertTriangle, CheckCircle2, Eye, Server, Webhook
} from "lucide-react";
import { Helmet } from "react-helmet-async";

const SecurityDocumentation = () => {
  return (
    <AdminLayout title="Documentação de Segurança">
      <Helmet>
        <title>Documentação de Segurança | Admin VilaFood</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Documentação de Segurança</h1>
            <p className="text-muted-foreground">
              Protocolos, políticas e níveis de acesso da plataforma VilaFood
            </p>
          </div>
        </div>

        <Tabs defaultValue="niveis" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="niveis">Níveis de Acesso</TabsTrigger>
            <TabsTrigger value="rls">Políticas RLS</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          {/* Níveis de Acesso */}
          <TabsContent value="niveis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Hierarquia de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Super Admin */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Super Admin</Badge>
                    <span className="font-semibold">Acesso Total</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Acesso a todos os estabelecimentos via "Acessar Painel"</li>
                    <li>• Gestão de usuários, planos e assinaturas</li>
                    <li>• Configurações globais da plataforma</li>
                    <li>• Visualização de relatórios financeiros completos</li>
                    <li>• Todos os acessos são registrados em admin_access_logs</li>
                  </ul>
                </div>

                {/* Manager */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500">Gerente</Badge>
                    <span className="font-semibold">Acesso ao Estabelecimento</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Acesso completo ao painel do estabelecimento</li>
                    <li>• Gestão de produtos, categorias e pedidos</li>
                    <li>• Visualização de relatórios financeiros</li>
                    <li>• Configurações do estabelecimento</li>
                    <li>• Gestão de entregadores e integrações</li>
                  </ul>
                </div>

                {/* Cashier */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">Caixa</Badge>
                    <span className="font-semibold">Acesso Limitado</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Acesso ao PDV (Ponto de Venda)</li>
                    <li>• Processamento de pagamentos</li>
                    <li>• Visualização de pedidos</li>
                    <li>• Sem acesso a relatórios financeiros</li>
                  </ul>
                </div>

                {/* Attendant */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500">Atendente</Badge>
                    <span className="font-semibold">Acesso Mínimo</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Recebimento de pedidos</li>
                    <li>• Atualização de status</li>
                    <li>• Sem acesso a dados financeiros</li>
                  </ul>
                </div>

                {/* Customer */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Cliente</Badge>
                    <span className="font-semibold">Acesso Público</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Visualização de estabelecimentos e produtos públicos</li>
                    <li>• Gestão do próprio perfil e endereços</li>
                    <li>• Visualização dos próprios pedidos</li>
                    <li>• Criação de avaliações dos próprios pedidos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Políticas RLS */}
          <TabsContent value="rls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Row Level Security (RLS)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-green-500">RLS Habilitado</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Todas as tabelas sensíveis possuem Row Level Security habilitado para garantir 
                    isolamento de dados entre estabelecimentos e usuários.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Tabelas Protegidas</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      'establishments', 'products', 'orders', 'customers', 
                      'categories', 'reviews', 'payments', 'delivery_drivers',
                      'banners', 'coupons', 'profiles', 'user_roles'
                    ].map((table) => (
                      <div key={table} className="flex items-center gap-2 text-sm">
                        <Lock className="w-4 h-4 text-green-500" />
                        <code className="bg-muted px-2 py-1 rounded">{table}</code>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Políticas Principais</h4>
                  <div className="space-y-2 text-sm">
                    <div className="border rounded p-3">
                      <code className="text-primary">auth.uid() = user_id</code>
                      <p className="text-muted-foreground mt-1">
                        Usuários só acessam seus próprios dados (perfil, pedidos, endereços)
                      </p>
                    </div>
                    <div className="border rounded p-3">
                      <code className="text-primary">auth.uid() = owner_id</code>
                      <p className="text-muted-foreground mt-1">
                        Donos de estabelecimento só acessam dados do próprio estabelecimento
                      </p>
                    </div>
                    <div className="border rounded p-3">
                      <code className="text-primary">has_role(auth.uid(), 'super_admin')</code>
                      <p className="text-muted-foreground mt-1">
                        Super admins têm acesso via função security definer
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auditoria */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Logs de Auditoria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Tabelas de Auditoria</h4>
                  
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <code className="font-semibold">audit_logs</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Registro geral de todas as ações do sistema: criação, atualização e exclusão 
                      de registros, com dados antigos e novos para rastreabilidade completa.
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Campos: action, entity_type, entity_id, user_id, old_data, new_data, ip_address, user_agent
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <code className="font-semibold">admin_access_logs</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Registro específico de acessos de Super Admin a painéis de estabelecimentos, 
                      para compliance e resolução de disputas.
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Campos: admin_user_id, establishment_id, action, started_at, ended_at
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-500" />
                      <code className="font-semibold">agent_action_logs</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Logs de ações do agente IA WhatsApp, incluindo tempo de execução e resultados.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold">Retenção de Logs</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Logs de segurança: 6 meses</li>
                    <li>• Logs de transações financeiras: 5 anos</li>
                    <li>• Logs de acesso admin: 2 anos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pagamentos */}
          <TabsContent value="pagamentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Segurança de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Processadores Integrados</h4>
                  
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="font-semibold">Mercado Pago</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• OAuth 2.0 para autorização de lojistas</li>
                      <li>• Tokens armazenados criptografados em Supabase Secrets</li>
                      <li>• Webhooks validados via HMAC signature</li>
                      <li>• Split payment automático para comissões</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="font-semibold">PagSeguro</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• OAuth 2.0 Connect flow</li>
                      <li>• Refresh token automático</li>
                      <li>• Webhooks validados via token</li>
                      <li>• Split payment com comissão configurável</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span className="font-semibold">Proteções Implementadas</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Nenhum dado de cartão armazenado (PCI DSS compliant)</li>
                    <li>✓ Tokens de acesso nunca expostos ao frontend</li>
                    <li>✓ Webhook endpoints protegidos por validação de assinatura</li>
                    <li>✓ Detecção de anomalias em transações suspeitas</li>
                    <li>✓ Rate limiting em endpoints de pagamento</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhooks */}
          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="w-5 h-5" />
                  Segurança de Webhooks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="font-semibold">mercadopago-webhook</div>
                    <p className="text-sm text-muted-foreground">
                      Validação via HMAC signature usando secret do Mercado Pago.
                    </p>
                    <code className="text-xs bg-muted px-2 py-1 rounded block mt-2">
                      x-signature header + x-request-id validation
                    </code>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="font-semibold">pagseguro-webhook</div>
                    <p className="text-sm text-muted-foreground">
                      Validação via token de notificação nas configurações.
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="font-semibold">whatsapp-webhook</div>
                    <p className="text-sm text-muted-foreground">
                      Validação via API key da Evolution API.
                    </p>
                    <code className="text-xs bg-muted px-2 py-1 rounded block mt-2">
                      apikey header validation
                    </code>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">Edge Functions Autenticadas</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Todas as Edge Functions que processam dados sensíveis requerem JWT válido 
                    e verificam ownership do estabelecimento via authenticateRequest().
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default SecurityDocumentation;
