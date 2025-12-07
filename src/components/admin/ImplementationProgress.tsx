import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, MessageSquare, Bot, Settings } from 'lucide-react';

interface ProgressPhase {
  id: string;
  name: string;
  description: string;
  items: {
    name: string;
    status: 'completed' | 'in-progress' | 'pending';
    priority: 'high' | 'medium' | 'low';
  }[];
}

const phases: ProgressPhase[] = [
  {
    id: 'phase-1',
    name: 'Fase 1: Correções Críticas',
    description: 'Tabelas e funcionalidades essenciais',
    items: [
      { name: 'Tabela favorites', status: 'completed', priority: 'high' },
      { name: 'Tabela saved_addresses', status: 'completed', priority: 'high' },
      { name: 'Hook useFavorites', status: 'completed', priority: 'high' },
      { name: 'Hook useUserOrders', status: 'completed', priority: 'high' },
      { name: 'Página Orders.tsx com dados reais', status: 'completed', priority: 'high' },
      { name: 'Página Favorites.tsx com dados reais', status: 'completed', priority: 'high' },
    ]
  },
  {
    id: 'phase-2',
    name: 'Fase 2: Melhorias de UX',
    description: 'Experiência do usuário e design',
    items: [
      { name: 'Sistema de notificações com som', status: 'completed', priority: 'high' },
      { name: 'Modal de novo pedido', status: 'completed', priority: 'high' },
      { name: 'Auto-avanço VilaTok Stories', status: 'completed', priority: 'medium' },
      { name: 'Barra de progresso no vídeo', status: 'completed', priority: 'medium' },
      { name: 'Histórico integrado no DriverApp', status: 'completed', priority: 'medium' },
    ]
  },
  {
    id: 'phase-3',
    name: 'Fase 3: Integrações',
    description: 'APIs e serviços externos',
    items: [
      { name: 'Histórico do App Entregador', status: 'completed', priority: 'medium' },
      { name: 'GPS em tempo real (useDriverGPS)', status: 'completed', priority: 'medium' },
      { name: 'GPSStatusIndicator component', status: 'completed', priority: 'medium' },
      { name: 'Webhooks Mercado Pago', status: 'completed', priority: 'high' },
    ]
  },
  {
    id: 'phase-4',
    name: 'Fase 4: Configurações',
    description: 'Polimento e configurações',
    items: [
      { name: 'Configurações do Estabelecimento', status: 'completed', priority: 'medium' },
      { name: 'Área de serviço no mapa', status: 'completed', priority: 'low' },
    ]
  },
  {
    id: 'phase-5',
    name: 'Fase 5: Testes e Deploy',
    description: 'Validação e lançamento',
    items: [
      { name: 'Health Check do Sistema', status: 'completed', priority: 'high' },
      { name: 'Testes de fluxo completo', status: 'completed', priority: 'high' },
      { name: 'Documentação de APIs', status: 'completed', priority: 'medium' },
    ]
  },
  {
    id: 'phase-6',
    name: 'Fase 6: WhatsApp - Infraestrutura',
    description: 'Base de dados e configurações do módulo WhatsApp',
    items: [
      { name: 'Campos WhatsApp em plans (chatbot, ai_agent, max_messages)', status: 'completed', priority: 'high' },
      { name: 'Campos extras em whatsapp_instances (level, keywords)', status: 'completed', priority: 'high' },
      { name: 'Tabela whatsapp_keywords (palavras-chave)', status: 'completed', priority: 'high' },
      { name: 'Tabela whatsapp_auto_messages (mensagens automáticas)', status: 'completed', priority: 'high' },
      { name: 'Tabela whatsapp_carts (carrinhos temporários)', status: 'completed', priority: 'medium' },
      { name: 'Tabela whatsapp_conversations (histórico)', status: 'completed', priority: 'medium' },
      { name: 'RLS policies para todas as tabelas WhatsApp', status: 'completed', priority: 'high' },
      { name: 'PlansManagement.tsx com campos WhatsApp', status: 'completed', priority: 'high' },
    ]
  },
  {
    id: 'phase-7',
    name: 'Fase 7: WhatsApp - Nível 1 (Chatbot)',
    description: 'Chatbot com palavras-chave configuráveis',
    items: [
      { name: 'Interface de configuração de palavras-chave', status: 'completed', priority: 'high' },
      { name: 'Palavras-chave padrão (cardápio, pedido, horário)', status: 'completed', priority: 'high' },
      { name: 'Editor de mensagens automáticas', status: 'completed', priority: 'medium' },
      { name: 'Disparos automáticos de status de pedido', status: 'pending', priority: 'high' },
      { name: 'Edge Function whatsapp-chatbot', status: 'pending', priority: 'high' },
      { name: 'Teste de criação de instância Evolution API', status: 'pending', priority: 'high' },
    ]
  },
  {
    id: 'phase-8',
    name: 'Fase 8: WhatsApp - Nível 2 (Agente IA)',
    description: 'Agente IA com vendas conversacionais',
    items: [
      { name: 'Edge Function whatsapp-agent com Lovable AI', status: 'pending', priority: 'high' },
      { name: 'Tool Calling: search_products, add_to_cart', status: 'pending', priority: 'high' },
      { name: 'Tool Calling: validate_address, calculate_delivery', status: 'pending', priority: 'high' },
      { name: 'Tool Calling: create_pix_payment', status: 'pending', priority: 'high' },
      { name: 'Envio de imagens de produtos (CloudFront)', status: 'pending', priority: 'medium' },
      { name: 'Prompt personalizado por estabelecimento', status: 'pending', priority: 'medium' },
      { name: 'Edge Function whatsapp-followup (reativação)', status: 'pending', priority: 'low' },
    ]
  },
  {
    id: 'phase-9',
    name: 'Fase 9: WhatsApp - Interface de Configuração',
    description: 'Dashboard completo de WhatsApp',
    items: [
      { name: 'WhatsAppManagement.tsx com abas (Chatbot/Agente IA)', status: 'completed', priority: 'high' },
      { name: 'Dashboard de conversas (histórico)', status: 'pending', priority: 'medium' },
      { name: 'Estatísticas de WhatsApp (mensagens, conversões)', status: 'pending', priority: 'medium' },
      { name: 'Preview de conversa em tempo real', status: 'pending', priority: 'low' },
      { name: 'Bloqueio de features por plano', status: 'pending', priority: 'high' },
    ]
  }
];

export function ImplementationProgress() {
  const totalItems = phases.reduce((acc, phase) => acc + phase.items.length, 0);
  const completedItems = phases.reduce((acc, phase) => 
    acc + phase.items.filter(item => item.status === 'completed').length, 0
  );
  const inProgressItems = phases.reduce((acc, phase) => 
    acc + phase.items.filter(item => item.status === 'in-progress').length, 0
  );
  
  const overallProgress = Math.round((completedItems / totalItems) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Alta</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Média</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Baixa</Badge>;
    }
  };

  const getPhaseIcon = (phaseId: string) => {
    if (phaseId.includes('phase-6') || phaseId.includes('phase-7') || phaseId.includes('phase-8') || phaseId.includes('phase-9')) {
      if (phaseId === 'phase-8') return <Bot className="h-4 w-4 text-primary" />;
      if (phaseId === 'phase-9') return <Settings className="h-4 w-4 text-primary" />;
      return <MessageSquare className="h-4 w-4 text-primary" />;
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Progresso da Implementação</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              VilaFood - Sistema em Desenvolvimento Contínuo
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
            <div className="text-xs text-muted-foreground">
              {completedItems}/{totalItems} itens concluídos
            </div>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <Progress value={overallProgress} className="h-3" />
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {completedItems} concluídos
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-yellow-500" />
              {inProgressItems} em progresso
            </span>
            <span className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-muted-foreground" />
              {totalItems - completedItems - inProgressItems} pendentes
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {phases.map((phase) => {
          const phaseCompleted = phase.items.filter(i => i.status === 'completed').length;
          const phaseProgress = Math.round((phaseCompleted / phase.items.length) * 100);
          const isWhatsAppPhase = phase.id.includes('phase-6') || phase.id.includes('phase-7') || phase.id.includes('phase-8') || phase.id.includes('phase-9');
          
          return (
            <div key={phase.id} className={`space-y-3 ${isWhatsAppPhase ? 'p-4 rounded-lg bg-primary/5 border border-primary/20' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getPhaseIcon(phase.id)}
                  <div>
                    <h3 className="font-semibold">{phase.name}</h3>
                    <p className="text-xs text-muted-foreground">{phase.description}</p>
                  </div>
                </div>
                <span className="text-sm font-medium">{phaseProgress}%</span>
              </div>
              
              <Progress value={phaseProgress} className="h-2" />
              
              <div className="grid gap-2">
                {phase.items.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      item.status === 'completed' 
                        ? 'bg-green-500/10' 
                        : item.status === 'in-progress'
                        ? 'bg-yellow-500/10'
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className={`text-sm ${
                        item.status === 'completed' ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {item.name}
                      </span>
                    </div>
                    {getPriorityBadge(item.priority)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium">
              Módulo WhatsApp em desenvolvimento (Fases 6-9)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}