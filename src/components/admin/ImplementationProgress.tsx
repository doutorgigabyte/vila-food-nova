import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, Circle, Clock, MessageSquare, Bot, Settings, 
  Shield, ShoppingCart, Video, LayoutDashboard, CreditCard,
  Users, MapPin, Bell, Truck, Store, AlertTriangle
} from 'lucide-react';

interface ProgressPhase {
  id: string;
  name: string;
  description: string;
  category: 'completed' | 'security' | 'operation' | 'vilatok' | 'admin' | 'financial' | 'ux' | 'integration';
  items: {
    name: string;
    status: 'completed' | 'in-progress' | 'pending';
    priority: 'critical' | 'high' | 'medium' | 'low';
  }[];
}

const phases: ProgressPhase[] = [
  // ===== FASES CONCLUÍDAS =====
  {
    id: 'whatsapp-complete',
    name: '✅ Módulo WhatsApp',
    description: 'Chatbot + Agente IA + Monitoramento (100% concluído)',
    category: 'completed',
    items: [
      { name: 'Infraestrutura de tabelas e RLS', status: 'completed', priority: 'high' },
      { name: 'Nível 1: Chatbot com palavras-chave', status: 'completed', priority: 'high' },
      { name: 'Nível 2: Agente IA com Lovable AI', status: 'completed', priority: 'high' },
      { name: 'Interface de configuração completa', status: 'completed', priority: 'high' },
      { name: 'Health Check e monitoramento', status: 'completed', priority: 'high' },
      { name: 'Notificações automáticas de pedidos', status: 'completed', priority: 'high' },
    ]
  },

  // ===== PRIORIDADE 1: SEGURANÇA E SESSÃO =====
  {
    id: 'security-session',
    name: '🔒 P1: Segurança e Sessão',
    description: 'Correções críticas de logout, contexto e autenticação',
    category: 'security',
    items: [
      { name: 'Bug crítico: logout não invalida sessão (botão voltar loga novamente)', status: 'completed', priority: 'critical' },
      { name: 'Limpar storage/cookies no logout', status: 'completed', priority: 'critical' },
      { name: 'Validação de e-mail com código na criação de conta', status: 'completed', priority: 'high' },
      { name: 'Contexto de estabelecimento quebrado em WhatsApp & IA', status: 'completed', priority: 'high' },
      { name: 'Contexto de estabelecimento quebrado em Área de Atendimento', status: 'completed', priority: 'high' },
      { name: 'Erro RLS ao criar cupom no Admin', status: 'completed', priority: 'high' },
      { name: 'Visitante vê menus de usuário logado (ocultar)', status: 'completed', priority: 'medium' },
    ]
  },

  // ===== PRIORIDADE 2: OPERAÇÃO DA LOJA =====
  {
    id: 'pdv-operation',
    name: '💳 P2.1: PDV (Ponto de Venda)',
    description: 'Sistema de vendas presenciais',
    category: 'operation',
    items: [
      { name: 'PIX: Corrigir geração de QR Code (erro atual)', status: 'completed', priority: 'critical' },
      { name: 'Dinheiro: Confirmação de pagamento não funciona', status: 'completed', priority: 'critical' },
      { name: 'Cartão: Integração com Mercado Pago (Point + Manual)', status: 'completed', priority: 'critical' },
      { name: 'Criar pedido após pagamento confirmado', status: 'completed', priority: 'high' },
      { name: 'Atualização de status do pedido', status: 'completed', priority: 'high' },
      { name: 'Geração de comprovante', status: 'completed', priority: 'medium' },
    ]
  },
  {
    id: 'comanda-operation',
    name: '🍽️ P2.2: Comanda Digital',
    description: 'Sistema de mesas e garçom',
    category: 'operation',
    items: [
      { name: 'Botão "Abrir comanda" não funciona', status: 'completed', priority: 'critical' },
      { name: 'Nome do garçom vir do usuário logado (não digitado)', status: 'completed', priority: 'high' },
      { name: 'Mudar estado visual da mesa ao abrir comanda', status: 'completed', priority: 'high' },
      { name: 'Interface adaptada para tablet (touch)', status: 'completed', priority: 'medium' },
      { name: 'Integração com display de cozinha', status: 'completed', priority: 'medium' },
    ]
  },
  {
    id: 'stock-operation',
    name: '📦 P2.3: Estoque',
    description: 'Gestão de inventário',
    category: 'operation',
    items: [
      { name: 'Selecionar produto não carrega lista', status: 'completed', priority: 'critical' },
      { name: 'Vincular movimentações aos produtos da loja', status: 'completed', priority: 'high' },
      { name: 'Fluxo completo entrada/saída/ajuste/perda', status: 'completed', priority: 'high' },
    ]
  },
  {
    id: 'orders-operation',
    name: '📋 P2.4: Pedidos',
    description: 'Gestão de pedidos da loja',
    category: 'operation',
    items: [
      { name: 'Tela de pedidos funcional', status: 'completed', priority: 'critical' },
      { name: 'Integração com PDV', status: 'completed', priority: 'high' },
      { name: 'Fluxo de status: Pendente → Confirmado → Preparando → Pronto → Entrega', status: 'completed', priority: 'high' },
      { name: 'Integração com marketplace', status: 'completed', priority: 'high' },
      { name: 'Pedidos agendados para horário específico', status: 'completed', priority: 'medium' },
    ]
  },

  // ===== PRIORIDADE 3: VILATOK =====
  {
    id: 'vilatok-fixes',
    name: '🎬 P3: VilaTok / Stories',
    description: 'Correções da micro rede social',
    category: 'vilatok',
    items: [
      { name: 'Botão "Novo vídeo" abre tela branca (bug crítico)', status: 'completed', priority: 'critical' },
      { name: 'Fluxo completo: Upload → Cortar → Música → Detalhes → Agendar → Preview', status: 'completed', priority: 'high' },
      { name: 'Limitar repostagem automática a max 3x/dia', status: 'completed', priority: 'high' },
      { name: 'Separar criação de stories do perfil VilaTok', status: 'completed', priority: 'medium' },
      { name: 'Stories do cardápio exibir apenas da loja atual', status: 'completed', priority: 'high' },
      { name: 'Foto de perfil circular com anel de stories', status: 'completed', priority: 'medium' },
      { name: 'Remover IA isolada de produto (centralizar no Diagnóstico)', status: 'completed', priority: 'low' },
    ]
  },

  // ===== PRIORIDADE 4: ADMIN =====
  {
    id: 'admin-plans',
    name: '⚙️ P4.1: Planos e Regras de Negócio',
    description: 'Aplicar regras de plano no sistema',
    category: 'admin',
    items: [
      { name: 'Recursos configurados no plano refletir na loja', status: 'completed', priority: 'critical' },
      { name: 'WhatsApp básico vs. avançado por plano', status: 'completed', priority: 'high' },
      { name: 'Limite de stories no VilaTok por plano', status: 'completed', priority: 'high' },
      { name: 'Recursos de IA e analytics por plano', status: 'completed', priority: 'medium' },
      { name: 'Modelo de pagamento e ativação de planos', status: 'completed', priority: 'high' },
    ]
  },
  {
    id: 'admin-responsive',
    name: '📱 P4.2: Responsividade Admin (SuperAdmin)',
    description: 'Todas as telas admin para mobile',
    category: 'admin',
    items: [
      { name: 'Dashboard do SuperAdmin responsivo', status: 'completed', priority: 'high' },
      { name: 'Gestão de estabelecimentos responsiva', status: 'completed', priority: 'high' },
      { name: 'Gestão de usuários responsiva', status: 'completed', priority: 'high' },
      { name: 'Gestão de planos responsiva', status: 'completed', priority: 'medium' },
      { name: 'Gestão de assinaturas responsiva', status: 'completed', priority: 'medium' },
      { name: 'Gestão de vilas responsiva', status: 'completed', priority: 'medium' },
      { name: 'Gestão de categorias responsiva', status: 'completed', priority: 'medium' },
      { name: 'Configurações admin responsivas', status: 'completed', priority: 'medium' },
      { name: '✅ Verificação final: todas as telas admin responsivas', status: 'completed', priority: 'critical' },
    ]
  },
  {
    id: 'painel-responsive',
    name: '📱 P4.2.1: Responsividade Painel (Estabelecimento)',
    description: 'Todas as telas do painel do lojista para mobile',
    category: 'admin',
    items: [
      { name: 'Dashboard do estabelecimento responsivo', status: 'completed', priority: 'high' },
      { name: 'Gestão de produtos responsiva', status: 'completed', priority: 'high' },
      { name: 'Gestão de pedidos responsiva', status: 'completed', priority: 'high' },
      { name: 'PDV responsivo', status: 'completed', priority: 'high' },
      { name: 'Comanda digital responsiva', status: 'completed', priority: 'high' },
      { name: 'Display cozinha responsivo', status: 'completed', priority: 'high' },
      { name: 'Gestão de categorias responsiva', status: 'completed', priority: 'medium' },
      { name: 'Configurações da loja responsivas', status: 'completed', priority: 'medium' },
      { name: 'Relatórios responsivos', status: 'completed', priority: 'medium' },
      { name: 'WhatsApp responsivo', status: 'completed', priority: 'medium' },
      { name: 'Vídeos/Stories responsivo', status: 'completed', priority: 'medium' },
      { name: '✅ Verificação final: todas as telas do painel responsivas', status: 'completed', priority: 'critical' },
    ]
  },
  {
    id: 'admin-reports',
    name: '📊 P4.3: Relatórios',
    description: 'Módulo de relatórios e analytics',
    category: 'admin',
    items: [
      { name: 'Criar módulo de relatórios básico', status: 'completed', priority: 'high' },
      { name: 'Filtros por período, loja, vila', status: 'completed', priority: 'high' },
      { name: 'Health Check como ferramenta de monitoramento técnico', status: 'completed', priority: 'medium' },
      { name: 'Pedidos admin com visão analítica', status: 'completed', priority: 'medium' },
    ]
  },

  // ===== PRIORIDADE 5: FINANCEIRO E INTEGRAÇÕES =====
  {
    id: 'financial-integration',
    name: '💰 P5.1: Financeiro',
    description: 'Consolidar módulos financeiros',
    category: 'financial',
    items: [
      { name: 'Validar integração Mercado Pago completa', status: 'completed', priority: 'critical' },
      { name: 'Split em tempo real no pagamento', status: 'completed', priority: 'high' },
      { name: 'Consolidar pagamentos e fluxo de caixa em módulo único', status: 'completed', priority: 'high' },
      { name: 'Integrar com pedidos e PDV', status: 'completed', priority: 'high' },
      { name: 'Remover módulo de Cashback (complexo demais)', status: 'completed', priority: 'low' },
      { name: 'Unificar Vouchers e Cupons', status: 'completed', priority: 'medium' },
    ]
  },
  {
    id: 'pixels-integration',
    name: '📈 P5.2: Pixels e Feeds',
    description: 'Validar integrações de marketing',
    category: 'integration',
    items: [
      { name: 'Validar disparo de eventos Google Analytics', status: 'completed', priority: 'medium' },
      { name: 'Validar disparo de eventos Facebook Pixel', status: 'completed', priority: 'medium' },
      { name: 'Validar disparo de eventos TikTok Pixel', status: 'completed', priority: 'low' },
      { name: 'Validar feed XML para Meta e Google Merchant', status: 'completed', priority: 'medium' },
      { name: 'Página de diagnóstico de Pixels (/admin/diagnostico-pixels)', status: 'completed', priority: 'medium' },
      { name: 'Integração de eventos no carrinho (AddToCart)', status: 'completed', priority: 'high' },
      { name: 'Integração de eventos no checkout (InitiateCheckout)', status: 'completed', priority: 'high' },
      { name: 'Integração de eventos na compra (Purchase)', status: 'completed', priority: 'high' },
    ]
  },

  // ===== PRIORIDADE 6: SEGURANÇA FINANCEIRA =====
  {
    id: 'security-center',
    name: '🔐 P6.1: Central de Segurança',
    description: 'Dashboard de monitoramento de segurança financeira',
    category: 'security',
    items: [
      { name: 'Página Central de Segurança (/admin/central-seguranca)', status: 'completed', priority: 'critical' },
      { name: 'Dashboard de score de segurança', status: 'completed', priority: 'high' },
      { name: 'Verificação de RLS em tabelas financeiras', status: 'completed', priority: 'critical' },
      { name: 'Monitor de autenticação em Edge Functions', status: 'completed', priority: 'critical' },
      { name: 'Verificação de tokens e chaves PIX', status: 'completed', priority: 'high' },
      { name: 'Visualização de Audit Trail', status: 'completed', priority: 'high' },
      { name: 'Camadas financeiras por tipo de usuário', status: 'completed', priority: 'high' },
    ]
  },
  {
    id: 'edge-auth',
    name: '🔒 P6.2: Autenticação em Edge Functions',
    description: 'JWT + Ownership Check em funções de pagamento',
    category: 'security',
    items: [
      { name: 'JWT em mercadopago-multi-split', status: 'completed', priority: 'critical' },
      { name: 'JWT em driver-payment-split', status: 'completed', priority: 'critical' },
      { name: 'Validação de ownership em operações', status: 'completed', priority: 'high' },
    ]
  },
  {
    id: 'data-protection',
    name: '🛡️ P6.3: Proteção de Dados Sensíveis',
    description: 'Mascaramento e encriptação de tokens',
    category: 'security',
    items: [
      { name: 'Tokens MP não expostos via RLS', status: 'completed', priority: 'critical' },
      { name: 'Chaves PIX protegidas por políticas', status: 'completed', priority: 'high' },
      { name: 'Audit logging de acesso a dados financeiros', status: 'completed', priority: 'high' },
    ]
  },
  {
    id: 'anomaly-detection',
    name: '⚠️ P6.4: Detecção de Anomalias',
    description: 'Monitoramento de atividades suspeitas',
    category: 'security',
    items: [
      { name: 'Estatísticas de transações em tempo real', status: 'completed', priority: 'medium' },
      { name: 'Contador de transações pendentes/falhas', status: 'completed', priority: 'medium' },
      { name: 'Threshold de valores (alertas)', status: 'completed', priority: 'high' },
      { name: 'Alertas via WhatsApp para anomalias', status: 'completed', priority: 'medium' },
    ]
  },


  // ===== MELHORIAS DE UX =====
  {
    id: 'ux-marketplace',
    name: '🛒 UX: Marketplace',
    description: 'Correções de experiência do usuário',
    category: 'ux',
    items: [
      { name: 'Busca inteligente global (highlight, agrupamento, keyboard nav)', status: 'completed', priority: 'high' },
      { name: 'Sininho de notificações funcional na tela de categoria', status: 'completed', priority: 'high' },
      { name: 'Remover ícone de fogo (VilaTok) das categorias (redundante)', status: 'completed', priority: 'low' },
      { name: 'Espaçamento entre botão som e fechar nas notificações', status: 'completed', priority: 'medium' },
      { name: 'Slide 3D com tamanho fixo (não muda no scroll)', status: 'completed', priority: 'high' },
      { name: 'Cards de produtos com tamanho padronizado', status: 'completed', priority: 'high' },
      { name: 'Clique em produto abre page view', status: 'completed', priority: 'high' },
      { name: 'Clique em estabelecimento abre cardápio', status: 'completed', priority: 'critical' },
      { name: 'Filtros "Todos, Recém-chegados, Popular" funcionando', status: 'completed', priority: 'high' },
      { name: 'Ordenação funcionando (recomendados, avaliação, tempo, distância)', status: 'completed', priority: 'high' },
      { name: 'Vilas abrem ao clique (corrigido drag vs click)', status: 'completed', priority: 'high' },
      { name: 'Scroll horizontal otimizado com GPU acceleration', status: 'completed', priority: 'medium' },
    ]
  },
  {
    id: 'ux-cardapio',
    name: '📖 UX: Cardápio Digital',
    description: 'Melhorias na visualização de lojas',
    category: 'ux',
    items: [
      { name: 'Página carrega no topo (ScrollToTop global)', status: 'completed', priority: 'high' },
      { name: 'Foto de perfil circular com anel de stories', status: 'completed', priority: 'medium' },
      { name: 'Stories filtrados por establishment_id', status: 'completed', priority: 'high' },
      { name: 'Notificações 100% internas (toasts + modals)', status: 'completed', priority: 'medium' },
    ]
  },
  {
    id: 'ux-categories',
    name: '🏷️ UX: Categorias e Subcategorias',
    description: 'Lógica de filtros por categoria',
    category: 'ux',
    items: [
      { name: 'Categoria filtra estabelecimentos por segment_id', status: 'completed', priority: 'high' },
      { name: 'VilaTok filtra stories por categoria (parent_category_id)', status: 'completed', priority: 'high' },
      { name: 'VideoHighlights específicos por categoria', status: 'completed', priority: 'medium' },
      { name: 'Subcategoria filtra corretamente por segment_id', status: 'completed', priority: 'high' },
    ]
  },
  {
    id: 'ux-account',
    name: '👤 UX: Minha Conta',
    description: 'Páginas do usuário cliente',
    category: 'ux',
    items: [
      { name: 'Página "Meus endereços" com CRUD completo', status: 'completed', priority: 'high' },
      { name: 'Página "Minha conta" com edição de perfil', status: 'completed', priority: 'high' },
      { name: 'Modo escuro via next-themes (toggle em Menu e UserMenu)', status: 'completed', priority: 'low' },
      { name: 'Configurações do cliente na página Menu', status: 'completed', priority: 'low' },
    ]
  },

  // ===== CONFIGURAÇÕES DA LOJA =====
  {
    id: 'store-config',
    name: '⚙️ Configurações da Loja',
    description: 'Ajustes nas configurações do estabelecimento',
    category: 'operation',
    items: [
      { name: 'Horário de funcionamento por dia da semana (EstablishmentSettings)', status: 'completed', priority: 'high' },
      { name: 'Status automático baseado no horário', status: 'completed', priority: 'high' },
      { name: 'Taxa de entrega por km (delivery_base_fee + fee_per_km)', status: 'completed', priority: 'high' },
      { name: 'Split em tempo real para entregador (não agendado)', status: 'completed', priority: 'medium' },
      { name: 'QR Code da loja (QRCodeManagement)', status: 'completed', priority: 'low' },
      { name: 'Banners da loja (BannersManagement)', status: 'completed', priority: 'low' },
    ]
  },

  // ===== DIAGNÓSTICO IA =====
  {
    id: 'ai-diagnosis',
    name: '🤖 Diagnóstico de IA',
    description: 'Hub de inteligência artificial',
    category: 'integration',
    items: [
      { name: '"Aplicar melhorias" deve gerar textos otimizados', status: 'completed', priority: 'high' },
      { name: 'Sugestões de banners e organização', status: 'completed', priority: 'medium' },
      { name: 'Pré-preencher campos para lojista confirmar', status: 'completed', priority: 'medium' },
      { name: 'Relatório mais estratégico e poético', status: 'completed', priority: 'low' },
    ]
  },

  // ===== ENTREGADORES =====
  {
    id: 'delivery-drivers',
    name: '🚴 Entregadores',
    description: 'Sistema de entregadores',
    category: 'operation',
    items: [
      { name: 'App entregador: lista de lojas vinculadas', status: 'completed', priority: 'high' },
      { name: 'Entregador solicita vínculo com novas lojas', status: 'completed', priority: 'medium' },
      { name: 'Lojista aceita/recusa vínculo de entregador', status: 'completed', priority: 'medium' },
      { name: 'Pedido marketplace → loja → entregador', status: 'completed', priority: 'high' },
    ]
  },

  // ===== CARRINHO ABANDONADO =====
  {
    id: 'abandoned-cart',
    name: '🛒 Recuperador de Vendas',
    description: 'Carrinho abandonado + IA + WhatsApp',
    category: 'integration',
    items: [
      { name: 'Detectar carrinho abandonado', status: 'completed', priority: 'high' },
      { name: 'Programar mensagens WhatsApp automáticas', status: 'completed', priority: 'high' },
      { name: 'Intervalo configurável (1min, 5min, etc)', status: 'completed', priority: 'medium' },
    ]
  },

  // ===== LIMPEZA =====
  {
    id: 'cleanup',
    name: '🧹 Limpeza e Remoções',
    description: 'Remover módulos desnecessários',
    category: 'admin',
    items: [
      { name: 'Remover módulo de Fornecedores', status: 'completed', priority: 'low' },
      { name: 'Remover "Chamar suporte" do SuperAdmin', status: 'completed', priority: 'low' },
      { name: 'E-mail apenas para validação (não notificações)', status: 'completed', priority: 'medium' },
    ]
  },

  // ===== NOVAS IMPLEMENTAÇÕES: WHATSAPP AI AVANÇADO =====
  {
    id: 'whatsapp-ai-advanced',
    name: '🤖 WhatsApp AI Multi-Lojista Avançado',
    description: 'Agente IA com envio de mídia e integração N8N',
    category: 'integration',
    items: [
      { name: 'Campos menu_json e system_prompt em establishments', status: 'completed', priority: 'high' },
      { name: 'Campos n8n_webhook_url e ai_model em whatsapp_instances', status: 'completed', priority: 'high' },
      { name: 'Campos whatsapp_instance_name, evolution_api_token, gemini_api_key', status: 'completed', priority: 'high' },
      { name: 'Trigger automático para gerar menu_json ao mudar produtos', status: 'completed', priority: 'high' },
      { name: 'Edge Function: whatsapp-send-media (envio de imagens)', status: 'completed', priority: 'critical' },
      { name: 'Edge Function: generate-menu-json (cache de cardápio)', status: 'completed', priority: 'high' },
      { name: 'Tool send_product_photo no AI Response', status: 'completed', priority: 'critical' },
      { name: 'Tool search_menu no AI Response', status: 'completed', priority: 'high' },
      { name: 'UI: Editor de system_prompt personalizado', status: 'pending', priority: 'high' },
      { name: 'UI: Botão gerar/atualizar menu_json', status: 'pending', priority: 'medium' },
      { name: 'UI: Painel de teste de conversa IA', status: 'pending', priority: 'low' },
      { name: 'Suporte a webhook N8N externo', status: 'completed', priority: 'medium' },
      { name: 'Template n8n: VilaFood-Agent-Complete.json', status: 'completed', priority: 'critical' },
      { name: 'Template n8n: VilaFood-MercadoPago-PIX.json', status: 'completed', priority: 'high' },
      { name: 'Documentação: N8N_VILAFOOD_AGENT_ARCHITECTURE.md', status: 'completed', priority: 'high' },
    ]
  },

  // ===== ARQUITETURA N8N MULTI-LOJISTA =====
  {
    id: 'n8n-multi-tenant',
    name: '🔄 Arquitetura n8n Multi-Lojista',
    description: 'Fluxos Router → Brain → Tools para WhatsApp IA',
    category: 'integration',
    items: [
      { name: 'Camada 1: Master Router (identifica loja, busca config no DB)', status: 'completed', priority: 'critical' },
      { name: 'Camada 2: VilaFood AI Brain (Gemini com prompt dinâmico)', status: 'completed', priority: 'critical' },
      { name: 'Camada 3: Tools (save_customer, create_order_pix, send_photo)', status: 'completed', priority: 'critical' },
      { name: 'Tool send_product_photo (URL S3/CloudFront → Evolution API)', status: 'completed', priority: 'high' },
      { name: 'Tool save_customer com establishment_id dinâmico', status: 'completed', priority: 'high' },
      { name: 'Tool create_order_pix com access_token da loja', status: 'completed', priority: 'high' },
      { name: 'Memory por instance_name + remoteJid (isolamento de conversas)', status: 'completed', priority: 'high' },
      { name: 'Injeção dinâmica de system_prompt + menu_json', status: 'completed', priority: 'high' },
      { name: 'UI: Config whatsapp_instance_name no painel do lojista', status: 'pending', priority: 'medium' },
      { name: 'UI: Visualizador de cardápio JSON formatado', status: 'pending', priority: 'low' },
      { name: 'UI: Download templates n8n no Admin Settings', status: 'completed', priority: 'high' },
      { name: 'Documentação: Guia de setup n8n para VilaFood', status: 'completed', priority: 'low' },
      { name: 'Template n8n: Master Router', status: 'completed', priority: 'high' },
      { name: 'Template n8n: AI Brain', status: 'completed', priority: 'high' },
    ]
  },

  // ===== NOVAS IMPLEMENTAÇÕES: ENDEREÇOS INTELIGENTES =====
  {
    id: 'addresses-google',
    name: '📍 Endereços Inteligentes (Google)',
    description: 'CEP + Places + Maps em todos os cadastros',
    category: 'ux',
    items: [
      { name: 'Componente CepAutocomplete (ViaCEP)', status: 'completed', priority: 'high' },
      { name: 'Componente SmartAddressInput unificado', status: 'completed', priority: 'high' },
      { name: 'Tabela address_cache para otimização', status: 'completed', priority: 'medium' },
      { name: 'Integrar no Checkout do cliente', status: 'completed', priority: 'critical' },
      { name: 'Integrar no Onboarding (BasicDataStep)', status: 'completed', priority: 'high' },
      { name: 'Integrar em EstablishmentSettings', status: 'pending', priority: 'high' },
      { name: 'Integrar na página Meus Endereços', status: 'completed', priority: 'high' },
      { name: 'Autocomplete de bairros em DeliveryFees', status: 'pending', priority: 'medium' },
    ]
  },

  // ===== INTEGRAÇÃO PAGSEGURO =====
  {
    id: 'pagseguro-integration',
    name: '💳 Integração PagSeguro',
    description: 'Suporte a pagamentos via PagSeguro como alternativa ao Mercado Pago',
    category: 'financial',
    items: [
      { name: 'Gateway PagSeguro (estrutura base)', status: 'completed', priority: 'high' },
      { name: 'PIX via PagSeguro API', status: 'pending', priority: 'critical' },
      { name: 'Checkout transparente (cartão crédito/débito)', status: 'pending', priority: 'critical' },
      { name: 'Webhook para confirmação de pagamentos', status: 'pending', priority: 'critical' },
      { name: 'OAuth para conectar contas de lojistas', status: 'pending', priority: 'high' },
      { name: 'Split de pagamentos (marketplace)', status: 'pending', priority: 'high' },
      { name: 'UI: Seletor de gateway no checkout', status: 'pending', priority: 'medium' },
      { name: 'UI: Configuração PagSeguro em EstablishmentSettings', status: 'pending', priority: 'medium' },
    ]
  },

  // ===== OTIMIZAÇÃO DE PERFORMANCE =====
  {
    id: 'performance-optimization',
    name: '⚡ Otimização de Performance',
    description: 'Técnicas para melhorar desempenho em dispositivos antigos',
    category: 'ux',
    items: [
      { name: 'Lazy loading de rotas com React.lazy e Suspense', status: 'completed', priority: 'critical' },
      { name: 'Google Fonts: preconnect e otimização de carregamento', status: 'completed', priority: 'high' },
      { name: 'Virtualization de listas longas (react-window)', status: 'pending', priority: 'critical' },
      { name: 'Memoização de componentes pesados (React.memo)', status: 'pending', priority: 'critical' },
      { name: 'Debounce em buscas e filtros', status: 'pending', priority: 'high' },
      { name: 'Skeleton loading universal', status: 'completed', priority: 'high' },
      { name: 'Image optimization: WebP, srcset, lazy loading', status: 'pending', priority: 'high' },
      { name: 'Prefetch de dados críticos (React Query)', status: 'pending', priority: 'medium' },
      { name: 'Code splitting por rota e feature', status: 'pending', priority: 'high' },
      { name: 'Reduzir bundle size (tree shaking, imports seletivos)', status: 'pending', priority: 'high' },
      { name: 'Otimização de animações (will-change, GPU acceleration)', status: 'completed', priority: 'medium' },
      { name: 'Admin/Painel: carregamento progressivo de dados', status: 'pending', priority: 'high' },
      { name: 'Marketplace: infinite scroll com virtualization', status: 'pending', priority: 'high' },
      { name: 'Cache de imagens e assets via Service Worker', status: 'pending', priority: 'medium' },
    ]
  },
];

export function ImplementationProgress() {
  const totalItems = phases.reduce((acc, phase) => acc + phase.items.length, 0);
  const completedItems = phases.reduce((acc, phase) => 
    acc + phase.items.filter(item => item.status === 'completed').length, 0
  );
  const inProgressItems = phases.reduce((acc, phase) => 
    acc + phase.items.filter(item => item.status === 'in-progress').length, 0
  );
  const criticalItems = phases.reduce((acc, phase) => 
    acc + phase.items.filter(item => item.priority === 'critical' && item.status !== 'completed').length, 0
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
      case 'critical':
        return <Badge variant="destructive" className="text-xs animate-pulse">Crítica</Badge>;
      case 'high':
        return <Badge variant="destructive" className="text-xs">Alta</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Média</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Baixa</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'security':
        return <Shield className="h-5 w-5 text-red-500" />;
      case 'operation':
        return <ShoppingCart className="h-5 w-5 text-orange-500" />;
      case 'vilatok':
        return <Video className="h-5 w-5 text-pink-500" />;
      case 'admin':
        return <LayoutDashboard className="h-5 w-5 text-blue-500" />;
      case 'financial':
        return <CreditCard className="h-5 w-5 text-emerald-500" />;
      case 'ux':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'integration':
        return <Bot className="h-5 w-5 text-cyan-500" />;
      default:
        return <Settings className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/30';
      case 'security':
        return 'bg-red-500/10 border-red-500/30';
      case 'operation':
        return 'bg-orange-500/10 border-orange-500/30';
      case 'vilatok':
        return 'bg-pink-500/10 border-pink-500/30';
      case 'admin':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'financial':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'ux':
        return 'bg-purple-500/10 border-purple-500/30';
      case 'integration':
        return 'bg-cyan-500/10 border-cyan-500/30';
      default:
        return '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Roadmap Beta-Teste VillaFood</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Relatório completo de melhorias e correções
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
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
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
            {criticalItems > 0 && (
              <span className="flex items-center gap-1 text-red-500 font-medium">
                <AlertTriangle className="h-3 w-3" />
                {criticalItems} críticos
              </span>
            )}
          </div>
        </div>

        {/* Legenda de categorias */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-700">
            <Shield className="h-3 w-3 mr-1" /> Segurança
          </Badge>
          <Badge variant="outline" className="bg-orange-500/10 border-orange-500/30 text-orange-700">
            <ShoppingCart className="h-3 w-3 mr-1" /> Operação
          </Badge>
          <Badge variant="outline" className="bg-pink-500/10 border-pink-500/30 text-pink-700">
            <Video className="h-3 w-3 mr-1" /> VilaTok
          </Badge>
          <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-700">
            <LayoutDashboard className="h-3 w-3 mr-1" /> Admin
          </Badge>
          <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700">
            <CreditCard className="h-3 w-3 mr-1" /> Financeiro
          </Badge>
          <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-700">
            <Users className="h-3 w-3 mr-1" /> UX
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {phases.map((phase) => {
          const phaseCompleted = phase.items.filter(i => i.status === 'completed').length;
          const phaseProgress = Math.round((phaseCompleted / phase.items.length) * 100);
          const phaseCritical = phase.items.filter(i => i.priority === 'critical' && i.status !== 'completed').length;
          
          return (
            <div key={phase.id} className={`space-y-3 p-4 rounded-lg border ${getCategoryColor(phase.category)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(phase.category)}
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {phase.name}
                      {phaseCritical > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {phaseCritical} crítico{phaseCritical > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </h3>
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
                        : item.priority === 'critical'
                        ? 'bg-red-500/5'
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

        {/* Resumo das prioridades */}
        <div className="pt-4 border-t space-y-3">
          <h4 className="font-semibold text-sm">Prioridades de Implementação:</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">P1</Badge>
              <span>Segurança e Sessão - logout, contexto, RLS</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">P2</Badge>
              <span>Operação da Loja - PDV, Comanda, Estoque, Pedidos</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-pink-500">P3</Badge>
              <span>VilaTok - Stories, repostagem, perfil</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500">P4</Badge>
              <span>Admin - Planos, responsividade, relatórios</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500">P5</Badge>
              <span>Financeiro e Integrações - Mercado Pago, split, pixels</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-green-500" />
            <span className="text-green-600 font-medium">
              Módulo WhatsApp 100% concluído ✓
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
