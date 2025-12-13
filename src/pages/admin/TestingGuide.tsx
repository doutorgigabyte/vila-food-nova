import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import TestCredentialsCard from '@/components/admin/TestCredentialsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  Bug
} from 'lucide-react';

const vilaFoodCredentials = [
  { role: 'Super Admin', email: 'doutorgigabyte.ti@gmail.com', password: 'Master@2025!', badge: 'Admin', badgeVariant: 'destructive' as const },
  { role: 'Lojista (Doces e Tortas)', email: 'docestortas@teste.com', password: 'Teste@2025!', badge: 'Lojista', badgeVariant: 'default' as const },
  { role: 'Cliente Teste', email: 'cliente@teste.com', password: 'Teste@2025!', badge: 'Cliente', badgeVariant: 'secondary' as const },
  { role: 'Entregador Teste', email: 'entregador@teste.com', password: 'Teste@2025!', badge: 'Entregador', badgeVariant: 'outline' as const },
];

const mercadoPagoCredentials = [
  { role: 'Marketplace (Plataforma)', email: 'TESTUSER2002566892', password: 'N7H1GRCAAA', badge: 'Vendedor' },
  { role: 'Cliente Comprador', email: 'TESTUSER348aborador49', password: 'Z43r5aCFmV', badge: 'Comprador' },
  { role: 'Afiliado', email: 'TESTUSER1698564750', password: 'Wm1hL55kpf', badge: 'Integrador' },
  { role: 'Lojista Vendedor', email: 'TESTUSER1509698498', password: 'zWYNY05Xen', badge: 'Vendedor' },
  { role: 'Admin Teste', email: 'TESTUSER403316095', password: 'CdlMp35uaS', badge: 'Vendedor' },
];

const testCards = [
  { brand: 'Mastercard', number: '5031 4332 1540 6351', cvv: '123', expiry: '11/25', holder: 'APRO' },
  { brand: 'Visa', number: '4235 6477 2802 5682', cvv: '123', expiry: '11/25', holder: 'APRO' },
  { brand: 'American Express', number: '3753 651535 56885', cvv: '1234', expiry: '11/25', holder: 'APRO' },
  { brand: 'Elo Débito', number: '5067 2686 5051 7446', cvv: '123', expiry: '11/25', holder: 'APRO' },
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

const TestingGuide = () => {
  const [activeTab, setActiveTab] = useState('tester1');

  return (
    <AdminLayout title="Guia de Testes">
      <div className="space-y-6">
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
                            <li><code className="bg-muted px-1 rounded">/[slug]</code> - Cardápio digital</li>
                            <li><code className="bg-muted px-1 rounded">/[slug]/checkout</code> - Checkout</li>
                            <li><code className="bg-muted px-1 rounded">/acompanhar/[id]</code> - Rastreio</li>
                            <li><code className="bg-muted px-1 rounded">/perfil</code> - Perfil do cliente</li>
                            <li><code className="bg-muted px-1 rounded">/auth</code> - Login/Cadastro</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="admin">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Área Admin
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
                        <h4 className="font-semibold text-sm mb-2">Fluxo de Compra</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>☐ Retirada no local (sem pagamento online)</li>
                          <li>☐ Delivery com PIX</li>
                          <li>☐ Delivery com Cartão</li>
                          <li>☐ Delivery com Dinheiro</li>
                          <li>☐ Aplicar cupom de desconto</li>
                          <li>☐ Rastrear pedido</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Admin - Dashboard</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>☐ Métricas carregando</li>
                          <li>☐ Gráficos funcionais</li>
                          <li>☐ Filtros de data</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Admin - Gestão</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>☐ Listar estabelecimentos</li>
                          <li>☐ Acessar painel de loja</li>
                          <li>☐ Criar/editar usuário</li>
                          <li>☐ Criar voucher plataforma</li>
                          <li>☐ Visualizar relatórios</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Segurança</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>☐ Central de segurança OK</li>
                          <li>☐ Acesso não autorizado bloqueado</li>
                          <li>☐ Logout funcionando</li>
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
                            <li><code className="bg-muted px-1 rounded">/painel/[slug]</code> - Dashboard</li>
                            <li><code className="bg-muted px-1 rounded">/painel/[slug]/pedidos</code> - Pedidos</li>
                            <li><code className="bg-muted px-1 rounded">/painel/[slug]/produtos</code> - Produtos</li>
                            <li><code className="bg-muted px-1 rounded">/painel/[slug]/categorias</code> - Categorias</li>
                            <li><code className="bg-muted px-1 rounded">/painel/[slug]/stories</code> - VilaTok Stories</li>
                            <li><code className="bg-muted px-1 rounded">/painel/[slug]/tv</code> - VilaTok TV</li>
                            <li><code className="bg-muted px-1 rounded">/painel/[slug]/equipe</code> - Equipe</li>
                            <li><code className="bg-muted px-1 rounded">/painel/[slug]/entregadores</code> - Entregadores</li>
                            <li><code className="bg-muted px-1 rounded">/painel/[slug]/financeiro</code> - Financeiro</li>
                            <li><code className="bg-muted px-1 rounded">/painel/[slug]/cupons</code> - Cupons</li>
                            <li><code className="bg-muted px-1 rounded">/painel/[slug]/configuracoes</code> - Config</li>
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
                            <li><code className="bg-muted px-1 rounded">/kds/[token]</code> - Display público</li>
                            <li><code className="bg-muted px-1 rounded">/painel/[slug]/kds</code> - KDS autenticado</li>
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
                            <li><code className="bg-muted px-1 rounded">/entregador/entrega/[id]</code> - Entrega ativa</li>
                            <li><code className="bg-muted px-1 rounded">/entregador/historico</code> - Histórico</li>
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
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>☐ Login como lojista</li>
                          <li>☐ Dashboard com métricas</li>
                          <li>☐ Receber pedido em tempo real</li>
                          <li>☐ Confirmar → Preparando → Pronto</li>
                          <li>☐ CRUD de produtos</li>
                          <li>☐ Upload de imagens S3</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">VilaTok</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>☐ Criar story com imagem</li>
                          <li>☐ Criar slide TV com template</li>
                          <li>☐ Visualizar no display público</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">KDS</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>☐ Gerar token público</li>
                          <li>☐ Pedidos aparecem em tempo real</li>
                          <li>☐ Som de notificação</li>
                          <li>☐ Marcar como pronto</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Entregador</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>☐ Ver fila de entregas</li>
                          <li>☐ Aceitar entrega</li>
                          <li>☐ Atualizar status (coletado, entregue)</li>
                          <li>☐ Histórico de entregas</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">WhatsApp IA (N8N)</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>☐ Enviar mensagem de texto</li>
                          <li>☐ Buscar produto</li>
                          <li>☐ Adicionar ao carrinho</li>
                          <li>☐ Finalizar pedido PIX</li>
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
[O que deveria acontecer]

### Resultado Atual
[O que realmente acontece]

### Evidências
- Screenshot: [link]
- Console: [erros]
- Network: [requisições]

### Prioridade
[ ] Crítico (bloqueia uso)
[ ] Alto (afeta funcionalidade)
[ ] Médio (inconveniente)
[ ] Baixo (cosmético)`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default TestingGuide;
