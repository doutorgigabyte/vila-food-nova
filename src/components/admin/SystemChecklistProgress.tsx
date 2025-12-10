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
  XCircle,
  Megaphone,
  MessageSquare
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
        { id: 'c1', label: 'Acessar marketplace sem login', status: 'passed' },
        { id: 'c2', label: 'Buscar estabelecimento por categoria', status: 'passed' },
        { id: 'c3', label: 'Buscar estabelecimento por localização', status: 'passed' },
        { id: 'c4', label: 'Visualizar cardápio do estabelecimento', status: 'passed' },
        { id: 'c5', label: 'Adicionar produtos ao carrinho', status: 'passed' },
        { id: 'c6', label: 'Selecionar temperatura (bebidas/congelados)', status: 'passed' },
        { id: 'c7', label: 'Aplicar cupom de desconto', status: 'passed' },
        { id: 'c8', label: 'Fazer checkout como visitante', status: 'passed' },
        { id: 'c9', label: 'Fazer checkout como usuário logado', status: 'passed' },
        { id: 'c10', label: 'Pagar com PIX (QR Code dinâmico)', status: 'passed' },
        { id: 'c11', label: 'Pagar com cartão (Checkout Pro)', status: 'passed' },
        { id: 'c12', label: 'Pagar na entrega (dinheiro)', status: 'passed' },
        { id: 'c13', label: 'Acompanhar pedido em tempo real', status: 'passed' },
        { id: 'c14', label: 'Receber notificações WhatsApp', status: 'passed' },
        { id: 'c15', label: 'Avaliar pedido após entrega', status: 'passed' },
        { id: 'c16', label: 'Acessar histórico de pedidos', status: 'passed' },
        { id: 'c17', label: 'Gerenciar endereços salvos', status: 'passed' },
        { id: 'c18', label: 'Adicionar/remover favoritos', status: 'passed' },
      ]
    },
    {
      id: 'merchant',
      name: 'Jornada do Lojista',
      icon: <Store className="w-5 h-5" />,
      description: 'Testes do painel do estabelecimento',
      items: [
        { id: 'm1', label: 'Criar conta e validar e-mail', status: 'passed' },
        { id: 'm2', label: 'Completar onboarding (wizard 5 etapas)', status: 'passed' },
        { id: 'm3', label: 'Configurar dados da loja', status: 'passed' },
        { id: 'm4', label: 'Cadastrar produtos com imagens', status: 'passed' },
        { id: 'm5', label: 'Cadastrar categorias', status: 'passed' },
        { id: 'm6', label: 'Configurar horários de funcionamento', status: 'passed' },
        { id: 'm7', label: 'Conectar Mercado Pago (OAuth)', status: 'passed' },
        { id: 'm8', label: 'Conectar PagSeguro (OAuth)', status: 'passed' },
        { id: 'm9', label: 'Conectar WhatsApp (Evolution API)', status: 'passed' },
        { id: 'm10', label: 'Visualizar pedidos recebidos', status: 'passed' },
        { id: 'm11', label: 'Alterar status de pedidos', status: 'passed' },
        { id: 'm12', label: 'Usar PDV para vendas presenciais', status: 'passed' },
        { id: 'm13', label: 'Usar Comanda Digital', status: 'passed' },
        { id: 'm14', label: 'Gerenciar estoque', status: 'passed' },
        { id: 'm15', label: 'Visualizar relatórios financeiros', status: 'passed' },
        { id: 'm16', label: 'Visualizar Extrato de Comissões (dívida)', status: 'passed' },
        { id: 'm17', label: 'Aprovar/rejeitar solicitações de entregadores', status: 'passed' },
        { id: 'm18', label: 'Configurar pagamento entregador (split ou por fora)', status: 'passed' },
        { id: 'm19', label: 'Configurar área de entrega', status: 'passed' },
        { id: 'm20', label: 'Configurar taxas de entrega por zona/km', status: 'passed' },
        { id: 'm21', label: 'Criar cupons de desconto', status: 'passed' },
        { id: 'm22', label: 'Gerenciar banners', status: 'passed' },
        { id: 'm23', label: 'Responder avaliações de clientes', status: 'passed' },
        { id: 'm24', label: 'Imprimir cupom de pedido (formatado)', status: 'passed' },
        { id: 'm25', label: 'Configurar entrega Turbo (taxa e habilitação)', status: 'passed' },
        { id: 'm26', label: 'Rastrear entregas em tempo real', status: 'passed' },
      ]
    },
    {
      id: 'admin',
      name: 'Jornada do Admin',
      icon: <Shield className="w-5 h-5" />,
      description: 'Testes do painel administrativo da plataforma',
      items: [
        { id: 'a1', label: 'Acessar painel administrativo', status: 'passed' },
        { id: 'a2', label: 'Visualizar dashboard com métricas', status: 'passed' },
        { id: 'a3', label: 'Gerenciar estabelecimentos', status: 'passed' },
        { id: 'a4', label: 'Gerenciar usuários', status: 'passed' },
        { id: 'a5', label: 'Gerenciar planos/assinaturas', status: 'passed' },
        { id: 'a6', label: 'Gerenciar categorias principais', status: 'passed' },
        { id: 'a7', label: 'Visualizar Security Center', status: 'passed' },
        { id: 'a8', label: 'Gerar relatórios financeiros', status: 'passed' },
        { id: 'a9', label: 'Cobrar comissões pendentes', status: 'passed' },
        { id: 'a10', label: 'Acessar painel de loja como admin', status: 'passed' },
        { id: 'a11', label: 'Gerenciar afiliados', status: 'passed' },
        { id: 'a12', label: 'Configurar gateways de pagamento', status: 'passed' },
        { id: 'a13', label: 'Visualizar logs de auditoria', status: 'passed' },
        { id: 'a14', label: 'Gerenciar vilas/regiões', status: 'passed' },
        { id: 'a15', label: 'Sidebar sem links quebrados', status: 'passed' },
        { id: 'a16', label: 'Central de Comunicação (Micro CRM)', status: 'passed' },
        { id: 'a17', label: 'Disparos em massa para lojistas', status: 'passed' },
        { id: 'a18', label: 'Templates de mensagens do sistema', status: 'passed' },
      ]
    },
    {
      id: 'driver',
      name: 'Jornada do Entregador',
      icon: <Bike className="w-5 h-5" />,
      description: 'Sistema de entregas com solicitações estilo Uber',
      items: [
        { id: 'd1', label: 'Fazer login no app', status: 'passed' },
        { id: 'd2', label: 'Visualizar solicitações de entrega (estilo Uber)', status: 'passed' },
        { id: 'd3', label: 'Card com valor, tempo, paradas e estabelecimento', status: 'passed' },
        { id: 'd4', label: 'Card especial para entregas Turbo', status: 'passed' },
        { id: 'd5', label: 'Temporizador de 60s para aceitar', status: 'passed' },
        { id: 'd6', label: 'Proteção contra aceite duplicado (realtime)', status: 'passed' },
        { id: 'd7', label: 'Escanear QR Code para vincular a estabelecimento', status: 'passed' },
        { id: 'd8', label: 'Ver entregas apenas de lojas vinculadas', status: 'passed' },
        { id: 'd9', label: 'Navegar até o estabelecimento', status: 'passed' },
        { id: 'd10', label: 'Confirmar coleta', status: 'passed' },
        { id: 'd11', label: 'Navegar até o cliente', status: 'passed' },
        { id: 'd12', label: 'Confirmar entrega', status: 'passed' },
        { id: 'd13', label: 'GPS tracking funcionando', status: 'passed' },
        { id: 'd14', label: 'Histórico de entregas', status: 'passed' },
        { id: 'd15', label: 'Entrega Turbo (prioridade única)', status: 'passed' },
        { id: 'd16', label: 'Múltiplas entregas com rota otimizada', status: 'passed' },
        { id: 'd17', label: 'Multi-estabelecimento (entregador em várias lojas)', status: 'passed' },
      ]
    },
    {
      id: 'financial',
      name: 'Modelo Financeiro Blindado',
      icon: <Shield className="w-5 h-5" />,
      description: 'Validação do modelo de split e comissões',
      items: [
        { id: 'f1', label: 'Split PIX: frete 100% para loja', status: 'passed' },
        { id: 'f2', label: 'Split PIX: 5% + R$1 para plataforma', status: 'passed' },
        { id: 'f3', label: 'Pagamento na entrega registra dívida', status: 'passed' },
        { id: 'f4', label: 'Extrato de comissões visível para loja', status: 'passed' },
        { id: 'f5', label: 'Desconto automático de dívida em vendas online', status: 'passed' },
        { id: 'f6', label: 'Trava para lojas com dívida alta', status: 'passed' },
        { id: 'f7', label: 'Webhook confirma pagamento PIX', status: 'passed' },
        { id: 'f8', label: 'Termos de uso atualizados (SaaS, não transportadora)', status: 'passed' },
        { id: 'f9', label: 'Lojista configura pagamento entregador (split ou por fora)', status: 'passed' },
        { id: 'f10', label: 'Aprovar/rejeitar entregadores que escanearam QR', status: 'passed' },
        { id: 'f11', label: 'Configurar valor/% do frete para entregador', status: 'passed' },
      ]
    },
    {
      id: 'whatsapp',
      name: 'Sistema WhatsApp (Doutorgigabyte)',
      icon: <MessageSquare className="w-5 h-5" />,
      description: 'Instância do sistema para notificações e autenticação',
      items: [
        { id: 'w1', label: 'Micro CRM de contatos de lojistas', status: 'passed' },
        { id: 'w2', label: 'Auto-cadastro de contato ao criar loja', status: 'passed' },
        { id: 'w3', label: 'Templates de mensagens do sistema', status: 'passed' },
        { id: 'w4', label: 'Disparo em massa com filtro por tags', status: 'passed' },
        { id: 'w5', label: 'Agendamento de campanhas', status: 'passed' },
        { id: 'w6', label: 'Envio de código de autenticação via WhatsApp', status: 'passed' },
        { id: 'w7', label: 'Notificação de novo pedido para lojista', status: 'passed' },
        { id: 'w8', label: 'Alerta de pagamento pendente', status: 'passed' },
        { id: 'w9', label: 'Aviso de manutenção programada', status: 'passed' },
        { id: 'w10', label: 'Comunicado de novas funcionalidades', status: 'passed' },
        { id: 'w11', label: 'Opt-out para contatos', status: 'passed' },
        { id: 'w12', label: 'Relatório de entregas de campanhas', status: 'passed' },
      ]
    },
    {
      id: 'n8n_agent',
      name: 'Agente IA N8N (WhatsApp)',
      icon: <Megaphone className="w-5 h-5" />,
      description: 'Chatbot inteligente para atendimento via WhatsApp',
      items: [
        { id: 'n1', label: 'Template N8N all-in-one com 11 tools', status: 'passed' },
        { id: 'n2', label: 'Debounce Redis (3s) para agrupar mensagens', status: 'passed' },
        { id: 'n3', label: 'Split de mensagens longas (400 chars + 1s delay)', status: 'passed' },
        { id: 'n4', label: 'Transcrição de áudio (Google Gemini)', status: 'passed' },
        { id: 'n5', label: 'Análise de imagem (Google Gemini)', status: 'passed' },
        { id: 'n6', label: 'Redis Chat Memory por sessão (phone+instance)', status: 'passed' },
        { id: 'n7', label: 'Tool: search_menu (busca no cardápio)', status: 'passed' },
        { id: 'n8', label: 'Tool: send_product_photo (envia foto)', status: 'passed' },
        { id: 'n9', label: 'Tool: add_to_cart / view_cart / clear_cart', status: 'passed' },
        { id: 'n10', label: 'Tool: save_customer (cadastro automático)', status: 'passed' },
        { id: 'n11', label: 'Tool: calculate_delivery_fee (frete)', status: 'passed' },
        { id: 'n12', label: 'Tool: create_order_pix (finaliza pedido)', status: 'passed' },
        { id: 'n13', label: 'Tool: send_pix_qrcode (envia QR)', status: 'passed' },
        { id: 'n14', label: 'Human Takeover (transfere para humano)', status: 'passed' },
        { id: 'n15', label: 'RPC: get_establishment_by_instance', status: 'passed' },
        { id: 'n16', label: 'RPC: search_products', status: 'passed' },
        { id: 'n17', label: 'Webhook Evolution API configurado', status: 'passed' },
        { id: 'n18', label: 'Painel HumanTakeoverPanel funcional', status: 'passed' },
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
    return { total, passed, failed, progress: Math.round((passed / total) * 100) };
  };

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'testing':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const overall = getOverallStats();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Roadmap de Implementação</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Checklist de verificação para lançamento em produção
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{overall.progress}%</div>
            <p className="text-xs text-muted-foreground">
              {overall.passed}/{overall.total} itens
            </p>
          </div>
        </div>
        <Progress value={overall.progress} className="h-2 mt-4" />
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map(section => {
          const stats = getSectionStats(section);
          const isOpen = openSections.includes(section.id);
          
          return (
            <Collapsible
              key={section.id}
              open={isOpen}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    {section.icon}
                    <div className="text-left">
                      <h3 className="font-medium">{section.name}</h3>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        {stats.passed} ✓
                      </Badge>
                      {stats.failed > 0 && (
                        <Badge variant="outline" className="bg-red-100 text-red-700">
                          {stats.failed} ✗
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {stats.progress}%
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 space-y-2 pl-4">
                  {section.items.map(item => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={item.status === 'passed'}
                          onCheckedChange={(checked) => 
                            updateItemStatus(section.id, item.id, checked ? 'passed' : 'pending')
                          }
                        />
                        <span className={item.status === 'passed' ? 'line-through text-muted-foreground' : ''}>
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <select
                          value={item.status}
                          onChange={(e) => updateItemStatus(section.id, item.id, e.target.value as ChecklistItem['status'])}
                          className="text-xs border rounded px-2 py-1 bg-background"
                        >
                          <option value="pending">Pendente</option>
                          <option value="testing">Testando</option>
                          <option value="passed">OK</option>
                          <option value="failed">Falhou</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default SystemChecklistProgress;
