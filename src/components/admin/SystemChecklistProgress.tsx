import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ShoppingCart, 
  Store, 
  Shield, 
  Bike,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  status: 'pending' | 'testing' | 'passed' | 'failed';
  notes?: string;
}

interface ChecklistSection {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  items: ChecklistItem[];
}

const SystemChecklistProgress = () => {
  const [sections, setSections] = useState<ChecklistSection[]>([
    {
      id: 'customer',
      name: 'Jornada do Cliente',
      icon: <ShoppingCart className="w-5 h-5" />,
      description: 'Testes do fluxo completo de compra do cliente',
      items: [
        { id: 'c1', label: 'Acessar marketplace sem login', status: 'pending' },
        { id: 'c2', label: 'Buscar estabelecimento por categoria', status: 'pending' },
        { id: 'c3', label: 'Buscar estabelecimento por localização', status: 'pending' },
        { id: 'c4', label: 'Visualizar cardápio do estabelecimento', status: 'pending' },
        { id: 'c5', label: 'Adicionar produtos ao carrinho', status: 'pending' },
        { id: 'c6', label: 'Selecionar temperatura (bebidas/congelados)', status: 'pending' },
        { id: 'c7', label: 'Aplicar cupom de desconto', status: 'pending' },
        { id: 'c8', label: 'Fazer checkout como visitante', status: 'pending' },
        { id: 'c9', label: 'Fazer checkout como usuário logado', status: 'pending' },
        { id: 'c10', label: 'Pagar com PIX (QR Code dinâmico)', status: 'pending' },
        { id: 'c11', label: 'Pagar com cartão (Checkout Pro)', status: 'pending' },
        { id: 'c12', label: 'Pagar na entrega (dinheiro)', status: 'pending' },
        { id: 'c13', label: 'Acompanhar pedido em tempo real', status: 'pending' },
        { id: 'c14', label: 'Receber notificações WhatsApp', status: 'pending' },
        { id: 'c15', label: 'Avaliar pedido após entrega', status: 'pending' },
        { id: 'c16', label: 'Acessar histórico de pedidos', status: 'pending' },
        { id: 'c17', label: 'Gerenciar endereços salvos', status: 'pending' },
        { id: 'c18', label: 'Adicionar/remover favoritos', status: 'pending' },
      ]
    },
    {
      id: 'merchant',
      name: 'Jornada do Lojista',
      icon: <Store className="w-5 h-5" />,
      description: 'Testes do painel do estabelecimento',
      items: [
        { id: 'm1', label: 'Criar conta e validar e-mail', status: 'pending' },
        { id: 'm2', label: 'Completar onboarding (wizard 5 etapas)', status: 'pending' },
        { id: 'm3', label: 'Configurar dados da loja', status: 'pending' },
        { id: 'm4', label: 'Cadastrar produtos com imagens', status: 'pending' },
        { id: 'm5', label: 'Cadastrar categorias', status: 'pending' },
        { id: 'm6', label: 'Configurar horários de funcionamento', status: 'pending' },
        { id: 'm7', label: 'Conectar Mercado Pago (OAuth)', status: 'pending' },
        { id: 'm8', label: 'Conectar PagSeguro (OAuth)', status: 'pending' },
        { id: 'm9', label: 'Conectar WhatsApp (Evolution API)', status: 'pending' },
        { id: 'm10', label: 'Visualizar pedidos recebidos', status: 'pending' },
        { id: 'm11', label: 'Alterar status de pedidos', status: 'pending' },
        { id: 'm12', label: 'Usar PDV para vendas presenciais', status: 'pending' },
        { id: 'm13', label: 'Usar Comanda Digital', status: 'pending' },
        { id: 'm14', label: 'Gerenciar estoque', status: 'pending' },
        { id: 'm15', label: 'Visualizar relatórios financeiros', status: 'pending' },
        { id: 'm16', label: 'Visualizar Extrato de Comissões (dívida)', status: 'pending' },
        { id: 'm17', label: 'Cadastrar entregadores (sem financeiro)', status: 'pending' },
        { id: 'm18', label: 'Configurar área de entrega', status: 'pending' },
        { id: 'm19', label: 'Configurar taxas de entrega por zona/km', status: 'pending' },
        { id: 'm20', label: 'Criar cupons de desconto', status: 'pending' },
        { id: 'm21', label: 'Gerenciar banners', status: 'pending' },
        { id: 'm22', label: 'Responder avaliações de clientes', status: 'pending' },
        { id: 'm23', label: 'Imprimir cupom de pedido (formatado)', status: 'pending' },
        { id: 'm24', label: 'Configurar entrega Turbo (taxa e habilitação)', status: 'pending' },
        { id: 'm25', label: 'Configurar máximo de pedidos por batch (padrão 4)', status: 'pending' },
        { id: 'm26', label: 'Rastrear entregas em tempo real', status: 'pending' },
      ]
    },
    {
      id: 'admin',
      name: 'Jornada do Admin',
      icon: <Shield className="w-5 h-5" />,
      description: 'Testes do painel administrativo da plataforma',
      items: [
        { id: 'a1', label: 'Acessar painel administrativo', status: 'pending' },
        { id: 'a2', label: 'Visualizar dashboard com métricas', status: 'pending' },
        { id: 'a3', label: 'Gerenciar estabelecimentos', status: 'pending' },
        { id: 'a4', label: 'Gerenciar usuários', status: 'pending' },
        { id: 'a5', label: 'Gerenciar planos/assinaturas', status: 'pending' },
        { id: 'a6', label: 'Gerenciar categorias principais', status: 'pending' },
        { id: 'a7', label: 'Visualizar Security Center', status: 'pending' },
        { id: 'a8', label: 'Gerar relatórios financeiros', status: 'pending' },
        { id: 'a9', label: 'Cobrar comissões pendentes', status: 'pending' },
        { id: 'a10', label: 'Acessar painel de loja como admin', status: 'pending' },
        { id: 'a11', label: 'Gerenciar afiliados', status: 'pending' },
        { id: 'a12', label: 'Configurar gateways de pagamento', status: 'pending' },
        { id: 'a13', label: 'Visualizar logs de auditoria', status: 'pending' },
        { id: 'a14', label: 'Gerenciar vilas/regiões', status: 'pending' },
      ]
    },
    {
      id: 'driver',
      name: 'Jornada do Entregador (Simplificado)',
      icon: <Bike className="w-5 h-5" />,
      description: 'App apenas para rastreio - sem financeiro (loja paga direto)',
      items: [
        { id: 'd1', label: 'Fazer login no app', status: 'pending' },
        { id: 'd2', label: 'Visualizar entregas atribuídas', status: 'pending' },
        { id: 'd3', label: 'Aceitar/recusar entrega', status: 'pending' },
        { id: 'd4', label: 'Navegar até o estabelecimento', status: 'pending' },
        { id: 'd5', label: 'Confirmar coleta', status: 'pending' },
        { id: 'd6', label: 'Navegar até o cliente', status: 'pending' },
        { id: 'd7', label: 'Confirmar entrega', status: 'pending' },
        { id: 'd8', label: 'GPS tracking funcionando', status: 'pending' },
        { id: 'd9', label: 'Histórico de entregas (sem valores)', status: 'pending' },
        { id: 'd10', label: 'Entrega Turbo (prioridade única)', status: 'pending' },
        { id: 'd11', label: 'Múltiplas entregas com rota otimizada (max 4)', status: 'pending' },
        { id: 'd12', label: 'Rastreio em tempo real para cliente', status: 'pending' },
        { id: 'd13', label: 'Rastreio em tempo real para lojista', status: 'pending' },
        { id: 'd14', label: 'Cliente vê posição na fila de entregas', status: 'pending' },
      ]
    },
    {
      id: 'financial',
      name: 'Modelo Financeiro Blindado',
      icon: <Shield className="w-5 h-5" />,
      description: 'Validação do modelo de split e comissões',
      items: [
        { id: 'f1', label: 'Split PIX: frete 100% para loja', status: 'pending' },
        { id: 'f2', label: 'Split PIX: 5% + R$1 para plataforma', status: 'pending' },
        { id: 'f3', label: 'Pagamento na entrega registra dívida', status: 'pending' },
        { id: 'f4', label: 'Extrato de comissões visível para loja', status: 'pending' },
        { id: 'f5', label: 'Desconto automático de dívida em vendas online', status: 'pending' },
        { id: 'f6', label: 'Trava para lojas com dívida alta', status: 'pending' },
        { id: 'f7', label: 'Webhook confirma pagamento PIX', status: 'pending' },
        { id: 'f8', label: 'Termos de uso atualizados (SaaS, não transportadora)', status: 'pending' },
      ]
    }
  ]);

  const [openSections, setOpenSections] = useState<string[]>(['customer']);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const updateItemStatus = (sectionId: string, itemId: string, status: ChecklistItem['status']) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? { ...item, status } : item
          )
        };
      }
      return section;
    }));
  };

  const getSectionStats = (section: ChecklistSection) => {
    const total = section.items.length;
    const passed = section.items.filter(i => i.status === 'passed').length;
    const failed = section.items.filter(i => i.status === 'failed').length;
    const testing = section.items.filter(i => i.status === 'testing').length;
    return { total, passed, failed, testing, progress: Math.round((passed / total) * 100) };
  };

  const getOverallStats = () => {
    const allItems = sections.flatMap(s => s.items);
    const total = allItems.length;
    const passed = allItems.filter(i => i.status === 'passed').length;
    const failed = allItems.filter(i => i.status === 'failed').length;
    const testing = allItems.filter(i => i.status === 'testing').length;
    return { total, passed, failed, testing, progress: Math.round((passed / total) * 100) };
  };

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'testing': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'passed': return <Badge className="bg-green-500">Passou</Badge>;
      case 'failed': return <Badge className="bg-red-500">Falhou</Badge>;
      case 'testing': return <Badge className="bg-yellow-500">Testando</Badge>;
      default: return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const overall = getOverallStats();

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Checklist de Produção</span>
            <Badge variant="outline" className="text-lg px-4 py-1">
              {overall.progress}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overall.progress} className="h-3 mb-4" />
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-muted-foreground">{overall.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{overall.passed}</p>
              <p className="text-sm text-muted-foreground">Passou</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{overall.testing}</p>
              <p className="text-sm text-muted-foreground">Testando</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{overall.failed}</p>
              <p className="text-sm text-muted-foreground">Falhou</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {sections.map(section => {
        const stats = getSectionStats(section);
        const isOpen = openSections.includes(section.id);

        return (
          <Card key={section.id}>
            <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.id)}>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {section.icon}
                      </div>
                      <div className="text-left">
                        <CardTitle className="text-lg">{section.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">{stats.passed}/{stats.total}</p>
                        <Progress value={stats.progress} className="w-24 h-2" />
                      </div>
                      <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {section.items.map(item => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={item.status === 'passed'}
                            onCheckedChange={(checked) => {
                              updateItemStatus(section.id, item.id, checked ? 'passed' : 'pending');
                            }}
                          />
                          <span className={item.status === 'passed' ? 'line-through text-muted-foreground' : ''}>
                            {item.label}
                          </span>
                          {getStatusIcon(item.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateItemStatus(section.id, item.id, 'testing')}
                            className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
                          >
                            Testando
                          </button>
                          <button
                            onClick={() => updateItemStatus(section.id, item.id, 'failed')}
                            className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20"
                          >
                            Falhou
                          </button>
                          <button
                            onClick={() => updateItemStatus(section.id, item.id, 'passed')}
                            className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20"
                          >
                            Passou
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {/* Instructions */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">📋 Como usar este checklist</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Clique em cada seção para expandir os itens de teste</li>
            <li>• Use os botões para marcar o status de cada item</li>
            <li>• <span className="text-yellow-500">Testando</span>: item está sendo verificado</li>
            <li>• <span className="text-green-500">Passou</span>: item funcionando corretamente</li>
            <li>• <span className="text-red-500">Falhou</span>: item com problemas a resolver</li>
            <li>• Meta: 100% dos itens marcados como "Passou" antes do deploy</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemChecklistProgress;
