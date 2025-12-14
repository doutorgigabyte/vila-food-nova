import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import TestCredentialsCard from '@/components/admin/TestCredentialsCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  FileText, 
  CreditCard, 
  Map, 
  CheckSquare, 
  Users,
  ShoppingCart,
  Store,
  Truck,
  Shield,
  Bug,
  AlertTriangle,
  Database,
  Clock,
  Target,
  XCircle
} from 'lucide-react';

const vilaFoodCredentials = [
  { role: 'Super Admin', email: 'doutorgigabyte.ti@gmail.com', password: '[Solicitar ao QA Lead]', badge: 'Admin', badgeVariant: 'destructive' as const },
  { role: 'Lojista (Doces e Tortas)', email: 'docestortas@teste.com', password: '[Solicitar ao QA Lead]', badge: 'Lojista', badgeVariant: 'default' as const },
  { role: 'Cliente Teste', email: 'cliente@teste.com', password: '[Solicitar ao QA Lead]', badge: 'Cliente', badgeVariant: 'secondary' as const },
  { role: 'Entregador Teste', email: 'entregador@teste.com', password: '[Solicitar ao QA Lead]', badge: 'Entregador', badgeVariant: 'outline' as const },
];

const mercadoPagoCredentials = [
  { role: 'Marketplace (Plataforma)', email: 'TESTUSER2002566892', password: '[Solicitar ao QA Lead]', badge: 'Vendedor' },
  { role: 'Cliente Comprador', email: 'TESTUSER34849', password: '[Solicitar ao QA Lead]', badge: 'Comprador' },
  { role: 'Afiliado', email: 'TESTUSER1698564750', password: '[Solicitar ao QA Lead]', badge: 'Integrador' },
  { role: 'Lojista Vendedor', email: 'TESTUSER1509698498', password: '[Solicitar ao QA Lead]', badge: 'Vendedor' },
  { role: 'Admin Teste', email: 'TESTUSER403316095', password: '[Solicitar ao QA Lead]', badge: 'Vendedor' },
];

const testCards = [
  { brand: 'Mastercard', number: '5031 4332 1540 6351', cvv: '[Ver MP Docs]', expiry: '11/25', holder: 'APRO' },
  { brand: 'Visa', number: '4235 6477 2802 5682', cvv: '[Ver MP Docs]', expiry: '11/25', holder: 'APRO' },
  { brand: 'American Express', number: '3753 651535 56885', cvv: '[Ver MP Docs]', expiry: '11/25', holder: 'APRO' },
  { brand: 'Elo Débito', number: '5067 2686 5051 7446', cvv: '[Ver MP Docs]', expiry: '11/25', holder: 'APRO' },
];

const paymentStatuses = [
  { code: 'APRO', status: 'Aprovado', description: 'Pagamento aprovado' },
  { code: 'OTHE', status: 'Recusado', description: 'Recusado por erro geral' },
  { code: 'CONT', status: 'Pendente', description: 'Pagamento pendente' },
  { code: 'CALL', status: 'Recusado', description: 'Ligar para autorizar' },
  { code: 'FUND', status: 'Recusado', description: 'Valor insuficiente' },
  { code: 'SECU', status: 'Recusado', description: 'Código de segurança inválido' },
  { code: 'EXPI', status: 'Recusado', description: 'Data de validade inválida' },
  { code: 'FORM', status: 'Recusado', description: 'Erro no formulário' },
];

const testPrerequisites = {
  establishment: 'Doces e Tortas (ID: 4c9b12fb-a4c6-453d-87c2-6a9c9b6b1491)',
  products: ['Bolo de Chocolate - R$ 45,00', 'Torta de Limão - R$ 38,00', 'Brigadeiro (10un) - R$ 25,00'],
  deliveryZone: 'Centro, Tirol, Petrópolis - Natal/RN',
  deliveryFee: 'R$ 5,00 - R$ 12,00 dependendo do bairro',
  operatingHours: 'Seg-Sex: 08:00-18:00 | Sáb: 08:00-14:00 | Dom: Fechado',
  testCoupon: 'TESTE10 (10% desconto, min R$ 30)',
  testAddress: 'Rua Apodi, 123 - Centro, Natal/RN - CEP 59025-000',
};

const expectedErrors = [
  { scenario: 'Login inválido', expected: 'Toast: "Email ou senha incorretos"', httpCode: '401' },
  { scenario: 'Produto indisponível', expected: 'Toast: "Produto fora de estoque"', httpCode: '400' },
  { scenario: 'Endereço fora da zona', expected: 'Toast: "Endereço fora da área de entrega"', httpCode: '400' },
  { scenario: 'Cupom expirado', expected: 'Toast: "Cupom não é mais válido"', httpCode: '400' },
  { scenario: 'Pagamento recusado', expected: 'Modal: "Pagamento não autorizado"', httpCode: '402' },
  { scenario: 'Sessão expirada', expected: 'Redirect para /auth', httpCode: '401' },
  { scenario: 'Permissão negada', expected: 'Redirect para /marketplace', httpCode: '403' },
  { scenario: 'Pedido não encontrado', expected: 'Página 404 ou toast de erro', httpCode: '404' },
];

const TestingGuide = () => {
  const [activeTab, setActiveTab] = useState('tester1');

  return (
    <AdminLayout title="Guia de Testes">
      <div className="space-y-6">
        {/* Aviso de Confidencialidade */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>DOCUMENTO CONFIDENCIAL - RESTRITO À EQUIPE DE QA</AlertTitle>
          <AlertDescription>
            Este documento contém credenciais sensíveis. Não compartilhe externamente. 
            Todas as credenciais devem ser atualizadas antes do lançamento em produção.
            Data de expiração: 30 dias após criação.
          </AlertDescription>
        </Alert>

        {/* Link para Checklist Consolidado */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>Checklist Consolidado de Testes Manuais</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              O documento completo com todos os testes e ações manuais está disponível em:
            </span>
            <code className="bg-muted px-2 py-1 rounded text-sm w-fit">
              docs/MANUAL_TESTING_CHECKLIST.md
            </code>
            <span className="text-xs text-muted-foreground">
              Inclui: Deploy, Infraestrutura, Segurança, Testes E2E Cliente/Lojista, Pagamentos e Monitoramento.
            </span>
          </AlertDescription>
        </Alert>

        {/* Credenciais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TestCredentialsCard
            title="Credenciais VilaFood"
            description="Contas do sistema para testes"
            credentials={vilaFoodCredentials}
          />
          <TestCredentialsCard
            title="Credenciais Mercado Pago"
            description="Contas de teste do MP"
            credentials={mercadoPagoCredentials}
          />
        </div>

        {/* Pré-requisitos de Dados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Pré-requisitos de Dados de Teste
            </CardTitle>
            <CardDescription>Dados necessários para execução consistente dos testes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Estabelecimento</p>
                <p className="text-sm font-medium">{testPrerequisites.establishment}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Horários</p>
                <p className="text-sm">{testPrerequisites.operatingHours}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Zona de Entrega</p>
                <p className="text-sm">{testPrerequisites.deliveryZone}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Taxa de Entrega</p>
                <p className="text-sm">{testPrerequisites.deliveryFee}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Cupom de Teste</p>
                <p className="text-sm font-mono">{testPrerequisites.testCoupon}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Endereço de Teste</p>
                <p className="text-sm">{testPrerequisites.testAddress}</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-primary/5 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">Produtos Disponíveis para Teste:</p>
              <div className="flex flex-wrap gap-2">
                {testPrerequisites.products.map((product, i) => (
                  <Badge key={i} variant="outline">{product}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cartões de Teste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Cartões de Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {testCards.map((card, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border">
                  <p className="font-semibold text-sm">{card.brand}</p>
                  <p className="font-mono text-xs mt-2">{card.number}</p>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>CVV: {card.cvv}</span>
                    <span>Exp: {card.expiry}</span>
                  </div>
                  <p className="text-xs mt-1">Nome: {card.holder}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Códigos de Status do Pagamento:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {paymentStatuses.map((status) => (
                  <div key={status.code} className="text-xs">
                    <Badge variant={status.status === 'Aprovado' ? 'default' : status.status === 'Pendente' ? 'secondary' : 'destructive'} className="mr-1">
                      {status.code}
                    </Badge>
                    <span className="text-muted-foreground">{status.description}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">CPF para pagamentos aprovados: 12345678909</p>
            </div>
          </CardContent>
        </Card>

        {/* Tratamento de Erros Esperados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Comportamento Esperado em Caso de Erro
            </CardTitle>
            <CardDescription>Referência para validação de cenários de falha</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Cenário</th>
                    <th className="text-left py-2 px-3">Resultado Esperado</th>
                    <th className="text-left py-2 px-3">HTTP</th>
                  </tr>
                </thead>
                <tbody>
                  {expectedErrors.map((error, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2 px-3">{error.scenario}</td>
                      <td className="py-2 px-3 text-muted-foreground">{error.expected}</td>
                      <td className="py-2 px-3"><Badge variant="outline">{error.httpCode}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Guias por Testador */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tester1" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Testador 1 (Cliente + Admin)
            </TabsTrigger>
            <TabsTrigger value="tester2" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Testador 2 (Lojista + Entrega)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tester1" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Mapa de Navegação */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Map className="h-5 w-5" />
                    Mapa de Navegação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Accordion type="multiple" className="w-full">
                      <AccordionItem value="cliente">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Área do Cliente
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 text-sm">
                            <li><code className="bg-muted px-1 rounded">/</code> - Home/Marketplace</li>
                            <li><code className="bg-muted px-1 rounded">/marketplace</code> - Lista de lojas</li>
                            <li><code className="bg-muted px-1 rounded">/loja/doces-e-tortas</code> - Cardápio digital</li>
                            <li><code className="bg-muted px-1 rounded">/checkout</code> - Checkout</li>
                            <li><code className="bg-muted px-1 rounded">/pedidos</code> - Meus pedidos</li>
                            <li><code className="bg-muted px-1 rounded">/pedidos/:id/rastreamento</code> - Rastreio</li>
                            <li><code className="bg-muted px-1 rounded">/conta</code> - Perfil do cliente</li>
                            <li><code className="bg-muted px-1 rounded">/auth</code> - Login/Cadastro</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="admin">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Área Admin (requer super_admin)
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 text-sm">
                            <li><code className="bg-muted px-1 rounded">/admin</code> - Dashboard</li>
                            <li><code className="bg-muted px-1 rounded">/admin/estabelecimentos</code> - Lojas</li>
                            <li><code className="bg-muted px-1 rounded">/admin/usuarios</code> - Usuários</li>
                            <li><code className="bg-muted px-1 rounded">/admin/cupons</code> - Vouchers</li>
                            <li><code className="bg-muted px-1 rounded">/admin/financeiro</code> - Financeiro</li>
                            <li><code className="bg-muted px-1 rounded">/admin/relatorios</code> - Relatórios</li>
                            <li><code className="bg-muted px-1 rounded">/admin/central-seguranca</code> - Segurança</li>
                            <li><code className="bg-muted px-1 rounded">/admin/roadmap</code> - Roadmap</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckSquare className="h-5 w-5" />
                    Checklist de Testes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4" /> Fluxo de Compra
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex justify-between">
                            <span>☐ Retirada no local</span>
                            <span className="text-xs">→ Status: confirmed</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Delivery com PIX</span>
                            <span className="text-xs">→ QR Code gerado</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Delivery com Cartão</span>
                            <span className="text-xs">→ Redirect MP</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Delivery com Dinheiro</span>
                            <span className="text-xs">→ Troco calculado</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Cupom TESTE10</span>
                            <span className="text-xs">→ 10% desconto</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Rastrear pedido</span>
                            <span className="text-xs">→ Timeline atualiza</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Admin - Dashboard
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex justify-between">
                            <span>☐ Métricas carregando</span>
                            <span className="text-xs">→ Números &gt; 0</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Gráficos funcionais</span>
                            <span className="text-xs">→ Recharts render</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Filtros de data</span>
                            <span className="text-xs">→ Dados atualizam</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Admin - Gestão</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>☐ Listar estabelecimentos (filtro por status)</li>
                          <li>☐ Acessar painel de loja (admin_access_logs)</li>
                          <li>☐ Criar/editar usuário (roles table)</li>
                          <li>☐ Criar voucher plataforma</li>
                          <li>☐ Visualizar relatórios (exportar CSV)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Segurança</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>☐ Central de segurança OK</li>
                          <li>☐ Cliente tentando /admin → 403</li>
                          <li>☐ Logout limpa sessão</li>
                        </ul>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tester2" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Mapa de Navegação */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Map className="h-5 w-5" />
                    Mapa de Navegação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Accordion type="multiple" className="w-full">
                      <AccordionItem value="lojista">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            Painel do Lojista
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 text-sm">
                            <li><code className="bg-muted px-1 rounded">/painel/doces-e-tortas</code> - Dashboard</li>
                            <li><code className="bg-muted px-1 rounded">/painel/doces-e-tortas/pedidos</code> - Pedidos</li>
                            <li><code className="bg-muted px-1 rounded">/painel/doces-e-tortas/produtos</code> - Produtos</li>
                            <li><code className="bg-muted px-1 rounded">/painel/doces-e-tortas/categorias</code> - Categorias</li>
                            <li><code className="bg-muted px-1 rounded">/painel/doces-e-tortas/stories</code> - VilaTok Stories</li>
                            <li><code className="bg-muted px-1 rounded">/painel/doces-e-tortas/vilatok-tv</code> - VilaTok TV</li>
                            <li><code className="bg-muted px-1 rounded">/painel/doces-e-tortas/equipe</code> - Equipe</li>
                            <li><code className="bg-muted px-1 rounded">/painel/doces-e-tortas/entregadores</code> - Entregadores</li>
                            <li><code className="bg-muted px-1 rounded">/painel/doces-e-tortas/financeiro</code> - Financeiro</li>
                            <li><code className="bg-muted px-1 rounded">/painel/doces-e-tortas/cupons</code> - Cupons</li>
                            <li><code className="bg-muted px-1 rounded">/painel/doces-e-tortas/configuracoes</code> - Config</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="kds">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <CheckSquare className="h-4 w-4" />
                            KDS (Cozinha)
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 text-sm">
                            <li><code className="bg-muted px-1 rounded">/display/cozinha/:token</code> - Display público</li>
                            <li><code className="bg-muted px-1 rounded">/painel/doces-e-tortas/cozinha</code> - KDS autenticado</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="entregador">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Área do Entregador
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 text-sm">
                            <li><code className="bg-muted px-1 rounded">/entregador</code> - Fila de entregas</li>
                            <li><code className="bg-muted px-1 rounded">/entregador</code> - Entrega ativa</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckSquare className="h-5 w-5" />
                    Checklist de Testes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Painel Lojista</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex justify-between">
                            <span>☐ Login como lojista</span>
                            <span className="text-xs">→ Redirect /painel</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Dashboard com métricas</span>
                            <span className="text-xs">→ Números corretos</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Receber pedido realtime</span>
                            <span className="text-xs">→ Toast + som</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Confirmar → Pronto</span>
                            <span className="text-xs">→ Status atualiza</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ CRUD de produtos</span>
                            <span className="text-xs">→ Lista atualiza</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Upload imagem S3</span>
                            <span className="text-xs">→ CloudFront URL</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">VilaTok</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex justify-between">
                            <span>☐ Criar story</span>
                            <span className="text-xs">→ Aparece em /vilatok</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Criar slide TV</span>
                            <span className="text-xs">→ Preview correto</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Display público</span>
                            <span className="text-xs">→ Token funciona</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">KDS</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex justify-between">
                            <span>☐ Gerar token público</span>
                            <span className="text-xs">→ URL copiável</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Pedidos realtime</span>
                            <span className="text-xs">→ Splash + som</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Marcar como pronto</span>
                            <span className="text-xs">→ delivery_request cria</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Entregador</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex justify-between">
                            <span>☐ Ver fila de entregas</span>
                            <span className="text-xs">→ Pedidos pendentes</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Aceitar entrega</span>
                            <span className="text-xs">→ Status: assigned</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Marcar coletado</span>
                            <span className="text-xs">→ Status: picked_up</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Marcar entregue</span>
                            <span className="text-xs">→ Status: delivered</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">WhatsApp IA (N8N)</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex justify-between">
                            <span>☐ Enviar mensagem</span>
                            <span className="text-xs">→ IA responde</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Buscar produto</span>
                            <span className="text-xs">→ Lista retorna</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Add carrinho</span>
                            <span className="text-xs">→ Redis atualiza</span>
                          </li>
                          <li className="flex justify-between">
                            <span>☐ Finalizar PIX</span>
                            <span className="text-xs">→ QR Code enviado</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Template de Bug Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Template de Relatório de Bug
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <pre className="whitespace-pre-wrap">
{`## Bug Report

**Testador:** [1 ou 2]
**Data/Hora:** [dd/mm/yyyy hh:mm]
**Ambiente:** [Produção/Preview]

### Descrição
[Descreva o bug em 1-2 frases]

### Passos para Reproduzir
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

### Resultado Esperado
[O que deveria acontecer - use a tabela de erros acima]

### Resultado Atual
[O que realmente acontece]

### Evidências
- Screenshot: [link]
- Console: [erros específicos]
- Network: [status code + endpoint]

### Prioridade
[ ] Crítico (bloqueia uso)
[ ] Alto (afeta funcionalidade principal)
[ ] Médio (inconveniente mas tem workaround)
[ ] Baixo (cosmético)

### Cleanup Necessário
[Dados criados que precisam ser removidos após teste]`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default TestingGuide;
