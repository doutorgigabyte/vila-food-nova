import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, Circle, Clock, MessageSquare, Bot, Settings, 
  Shield, ShoppingCart, Video, LayoutDashboard, CreditCard,
  Users, MapPin, Bell, Truck, Store, AlertTriangle, Star
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
  // ===== MÓDULOS 100% CONCLUÍDOS =====
  {
    id: 'whatsapp-complete',
    name: '✅ WhatsApp + Agente IA (Completo)',
    description: 'Infraestrutura completa: Tier 1 (Chatbot), Tier 2 (Agente IA), N8N Multi-Lojista',
    category: 'completed',
    items: [
      // Infraestrutura Base
      { name: 'Infraestrutura de tabelas (whatsapp_instances, sessions, messages)', status: 'completed', priority: 'high' },
      { name: 'RLS policies para isolamento multi-lojista', status: 'completed', priority: 'critical' },
      { name: 'Campos menu_json e system_prompt em establishments', status: 'completed', priority: 'high' },
      { name: 'Campos n8n_webhook_url, ai_model, whatsapp_instance_name', status: 'completed', priority: 'high' },
      { name: 'Trigger automático para gerar menu_json ao mudar produtos', status: 'completed', priority: 'high' },
      // Tier 1: Chatbot
      { name: 'Tier 1: Chatbot com palavras-chave configuráveis', status: 'completed', priority: 'high' },
      { name: 'Tier 1: Auto-mensagens por evento (boas vindas, horário, etc)', status: 'completed', priority: 'high' },
      // Tier 2: Agente IA
      { name: 'Tier 2: Agente IA com Lovable AI (Google Gemini)', status: 'completed', priority: 'critical' },
      { name: 'Tier 2: Edge Function whatsapp-ai-response com tools', status: 'completed', priority: 'critical' },
      { name: 'Tier 2: Tool search_menu (busca no cardápio)', status: 'completed', priority: 'high' },
      { name: 'Tier 2: Tool send_product_photo (envia foto do produto)', status: 'completed', priority: 'critical' },
      { name: 'Tier 2: Tool add_to_cart (adiciona ao carrinho)', status: 'completed', priority: 'critical' },
      { name: 'Tier 2: Tool checkout (finaliza pedido com PIX)', status: 'completed', priority: 'critical' },
      { name: 'Tier 2: Tool human_takeover (transfere para humano)', status: 'completed', priority: 'high' },
      // N8N Multi-Lojista
      { name: 'N8N: Camada 1 - Master Router (identifica loja, busca config)', status: 'completed', priority: 'critical' },
      { name: 'N8N: Camada 2 - AI Brain (Gemini com prompt dinâmico)', status: 'completed', priority: 'critical' },
      { name: 'N8N: Camada 3 - Tools (save_customer, create_order_pix)', status: 'completed', priority: 'critical' },
      { name: 'N8N: Memory por instance_name + remoteJid', status: 'completed', priority: 'high' },
      { name: 'N8N: Templates JSON para importação', status: 'completed', priority: 'high' },
      // Edge Functions
      { name: 'Edge Function: whatsapp-send-media (envio de imagens)', status: 'completed', priority: 'critical' },
      { name: 'Edge Function: generate-menu-json (cache de cardápio)', status: 'completed', priority: 'high' },
      { name: 'Edge Function: whatsapp-human-takeover', status: 'completed', priority: 'high' },
      { name: 'Edge Function: whatsapp-webhook (Evolution API v2)', status: 'completed', priority: 'critical' },
      // UI Completa
      { name: 'UI: Painel de configuração WhatsApp completo', status: 'completed', priority: 'high' },
      { name: 'UI: Health Check e monitoramento', status: 'completed', priority: 'high' },
      { name: 'UI: Painel Human Takeover (pausar/resumir IA)', status: 'completed', priority: 'high' },
      { name: 'UI: Histórico de conversas por sessão', status: 'completed', priority: 'medium' },
      { name: 'UI: Log de ações do agente em tempo real', status: 'completed', priority: 'medium' },
      { name: 'UI: Editor visual de system_prompt', status: 'completed', priority: 'high' },
      { name: 'UI: Download templates n8n no Admin Settings', status: 'completed', priority: 'high' },
      // Documentação
      { name: 'Documentação: N8N_VILAFOOD_AGENT_ARCHITECTURE.md', status: 'completed', priority: 'high' },
      { name: 'Documentação: Guia de setup n8n para VilaFood', status: 'completed', priority: 'low' },
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
      { name: 'Contexto de estabelecimento em WhatsApp & IA', status: 'completed', priority: 'high' },
      { name: 'Contexto de estabelecimento em Área de Atendimento', status: 'completed', priority: 'high' },
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
      { name: 'PIX: Geração de QR Code funcional', status: 'completed', priority: 'critical' },
      { name: 'Dinheiro: Confirmação de pagamento', status: 'completed', priority: 'critical' },
      { name: 'Cartão: Integração Mercado Pago (Point + Manual)', status: 'completed', priority: 'critical' },
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
      { name: 'Botão "Abrir comanda" funcional', status: 'completed', priority: 'critical' },
      { name: 'Nome do garçom vindo do usuário logado', status: 'completed', priority: 'high' },
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
      { name: 'Selecionar produto carrega lista corretamente', status: 'completed', priority: 'critical' },
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
      { name: 'Fluxo de status: Pendente → Confirmado → Preparando → Pronto → Entrega → Entregue', status: 'completed', priority: 'high' },
      { name: 'Integração com marketplace', status: 'completed', priority: 'high' },
      { name: 'Pedidos agendados para horário específico', status: 'completed', priority: 'medium' },
    ]
  },

  // ===== NOVO: ACOMPANHAMENTO DE PEDIDOS VIA WHATSAPP =====
  {
    id: 'order-tracking-whatsapp',
    name: '📱 Acompanhamento de Pedidos via WhatsApp',
    description: 'Notificações automáticas de cada etapa do pedido',
    category: 'integration',
    items: [
      { name: 'Campos whatsapp_tracking_enabled e customer_phone em orders', status: 'completed', priority: 'high' },
      { name: 'Campos review_token e review_token_expires_at em orders', status: 'completed', priority: 'high' },
      { name: 'Templates de mensagem para 7 status do pedido', status: 'completed', priority: 'critical' },
      { name: 'Edge Function: whatsapp-order-notifications atualizada', status: 'completed', priority: 'critical' },
      { name: 'Mensagem "Pedido Recebido" com resumo completo', status: 'completed', priority: 'high' },
      { name: 'Mensagem "Pedido Confirmado" com tempo estimado', status: 'completed', priority: 'high' },
      { name: 'Mensagem "Em Preparação" animada', status: 'completed', priority: 'high' },
      { name: 'Mensagem "Pronto para Retirada/Entrega"', status: 'completed', priority: 'high' },
      { name: 'Mensagem "Saiu para Entrega" com nome do entregador', status: 'completed', priority: 'high' },
      { name: 'Mensagem "Entregue" com CTA para avaliar', status: 'completed', priority: 'critical' },
      { name: 'Mensagem "Cancelado" com motivo', status: 'completed', priority: 'medium' },
      { name: 'Opt-in de tracking no checkout', status: 'completed', priority: 'high' },
      { name: 'Checkbox "Acompanhar pelo WhatsApp" no Checkout', status: 'completed', priority: 'high' },
    ]
  },

  // ===== NOVO: MÓDULO DE AVALIAÇÕES =====
  {
    id: 'reviews-module',
    name: '⭐ Módulo de Avaliações',
    description: 'Sistema completo de reviews e ratings',
    category: 'ux',
    items: [
      // Database
      { name: 'Tabela reviews com ratings múltiplos (overall, food, delivery, service)', status: 'completed', priority: 'critical' },
      { name: 'Campos rating_average e rating_count em establishments', status: 'completed', priority: 'critical' },
      { name: 'Trigger update_establishment_rating (média automática)', status: 'completed', priority: 'critical' },
      { name: 'RLS policies para reviews', status: 'completed', priority: 'high' },
      // Componentes
      { name: 'Componente StarRating (input interativo)', status: 'completed', priority: 'high' },
      { name: 'Componente ReviewForm (formulário completo)', status: 'completed', priority: 'high' },
      { name: 'Componente ReviewCard (exibição individual)', status: 'completed', priority: 'high' },
      { name: 'Componente ReviewsList (lista paginada)', status: 'completed', priority: 'high' },
      { name: 'Hook useReviews (CRUD completo)', status: 'completed', priority: 'high' },
      // Páginas
      { name: 'Página /avaliar/:orderId/:token (avaliação pública)', status: 'completed', priority: 'critical' },
      { name: 'Página /painel/:slug/avaliacoes (dashboard lojista)', status: 'completed', priority: 'high' },
      { name: 'Rota registrada no App.tsx', status: 'completed', priority: 'high' },
      // Funcionalidades
      { name: 'Link seguro com JWT (7 dias de validade)', status: 'completed', priority: 'high' },
      { name: 'Resposta do lojista à avaliação', status: 'completed', priority: 'medium' },
      { name: 'Filtros por estrela, data, respondidas/pendentes', status: 'completed', priority: 'medium' },
      // Integrações pendentes
      { name: 'Exibir estrelas nos cards de estabelecimento', status: 'completed', priority: 'high' },
      { name: 'Seção de avaliações na página da loja', status: 'completed', priority: 'medium' },
      { name: 'Ordenar por avaliação no marketplace', status: 'completed', priority: 'medium' },
      { name: 'Link "Avaliações" no sidebar do painel', status: 'completed', priority: 'high' },
    ]
  },

  // ===== PRIORIDADE 3: VILATOK =====
  {
    id: 'vilatok-fixes',
    name: '🎬 P3: VilaTok / Stories',
    description: 'Correções da micro rede social',
    category: 'vilatok',
    items: [
      { name: 'Botão "Novo vídeo" funcional', status: 'completed', priority: 'critical' },
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
    name: '📱 P4.2: Responsividade Admin/Painel',
    description: 'Todas as telas admin e painel para mobile',
    category: 'admin',
    items: [
      { name: 'Dashboard SuperAdmin responsivo', status: 'completed', priority: 'high' },
      { name: 'Gestão de estabelecimentos responsiva', status: 'completed', priority: 'high' },
      { name: 'Gestão de usuários responsiva', status: 'completed', priority: 'high' },
      { name: 'Dashboard estabelecimento responsivo', status: 'completed', priority: 'high' },
      { name: 'Gestão de produtos responsiva', status: 'completed', priority: 'high' },
      { name: 'PDV e Comanda responsivos', status: 'completed', priority: 'high' },
      { name: 'Display cozinha responsivo', status: 'completed', priority: 'high' },
      { name: 'WhatsApp e Vídeos responsivos', status: 'completed', priority: 'medium' },
      { name: '✅ Todas as telas verificadas', status: 'completed', priority: 'critical' },
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

  // ===== PRIORIDADE 5: FINANCEIRO =====
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
      { name: 'Unificar Vouchers e Cupons', status: 'completed', priority: 'medium' },
    ]
  },
  {
    id: 'pixels-integration',
    name: '📈 P5.2: Pixels e Feeds',
    description: 'Validar integrações de marketing',
    category: 'integration',
    items: [
      { name: 'Disparo de eventos Google Analytics', status: 'completed', priority: 'medium' },
      { name: 'Disparo de eventos Facebook Pixel', status: 'completed', priority: 'medium' },
      { name: 'Disparo de eventos TikTok Pixel', status: 'completed', priority: 'low' },
      { name: 'Feed XML para Meta e Google Merchant', status: 'completed', priority: 'medium' },
      { name: 'Página diagnóstico de Pixels', status: 'completed', priority: 'medium' },
      { name: 'Eventos AddToCart, InitiateCheckout, Purchase', status: 'completed', priority: 'high' },
    ]
  },

  // ===== PRIORIDADE 6: SEGURANÇA FINANCEIRA =====
  {
    id: 'security-center',
    name: '🔐 P6: Central de Segurança Financeira',
    description: 'Dashboard de monitoramento de segurança',
    category: 'security',
    items: [
      { name: 'Página Central de Segurança (/admin/central-seguranca)', status: 'completed', priority: 'critical' },
      { name: 'Dashboard de score de segurança', status: 'completed', priority: 'high' },
      { name: 'Verificação de RLS em tabelas financeiras', status: 'completed', priority: 'critical' },
      { name: 'Monitor de autenticação em Edge Functions', status: 'completed', priority: 'critical' },
      { name: 'Verificação de tokens e chaves PIX', status: 'completed', priority: 'high' },
      { name: 'Visualização de Audit Trail', status: 'completed', priority: 'high' },
      { name: 'JWT em mercadopago-multi-split e driver-payment-split', status: 'completed', priority: 'critical' },
      { name: 'Tokens MP não expostos via RLS', status: 'completed', priority: 'critical' },
      { name: 'Detecção de anomalias e alertas WhatsApp', status: 'completed', priority: 'medium' },
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
      { name: 'Notificações funcionais na tela de categoria', status: 'completed', priority: 'high' },
      { name: 'Slide 3D com tamanho fixo', status: 'completed', priority: 'high' },
      { name: 'Cards de produtos padronizados', status: 'completed', priority: 'high' },
      { name: 'Clique em produto abre page view', status: 'completed', priority: 'high' },
      { name: 'Clique em estabelecimento abre cardápio', status: 'completed', priority: 'critical' },
      { name: 'Filtros "Todos, Recém-chegados, Popular" funcionando', status: 'completed', priority: 'high' },
      { name: 'Ordenação funcionando (recomendados, avaliação, tempo, distância)', status: 'completed', priority: 'high' },
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
      { name: 'VilaTok filtra stories por categoria', status: 'completed', priority: 'high' },
      { name: 'VideoHighlights específicos por categoria', status: 'completed', priority: 'medium' },
      { name: 'Subcategoria filtra corretamente', status: 'completed', priority: 'high' },
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
      { name: 'Modo escuro via next-themes', status: 'completed', priority: 'low' },
    ]
  },

  // ===== ENDEREÇOS INTELIGENTES =====
  {
    id: 'addresses-google',
    name: '📍 Endereços Inteligentes (Google)',
    description: 'CEP + Places + Maps em todos os cadastros',
    category: 'ux',
    items: [
      { name: 'Componente CepAutocomplete (ViaCEP)', status: 'completed', priority: 'high' },
      { name: 'Componente SmartAddressInput unificado', status: 'completed', priority: 'high' },
      { name: 'Tabela address_cache para otimização', status: 'completed', priority: 'medium' },
      { name: 'Integrar no Checkout', status: 'completed', priority: 'critical' },
      { name: 'Integrar no Onboarding', status: 'completed', priority: 'high' },
      { name: 'Integrar em EstablishmentSettings', status: 'completed', priority: 'high' },
      { name: 'Integrar na página Meus Endereços', status: 'completed', priority: 'high' },
    ]
  },

  // ===== CONFIGURAÇÕES =====
  {
    id: 'store-config',
    name: '⚙️ Configurações da Loja',
    description: 'Ajustes nas configurações do estabelecimento',
    category: 'operation',
    items: [
      { name: 'Horário de funcionamento por dia da semana', status: 'completed', priority: 'high' },
      { name: 'Status automático baseado no horário', status: 'completed', priority: 'high' },
      { name: 'Taxa de entrega por km', status: 'completed', priority: 'high' },
      { name: 'Split em tempo real para entregador', status: 'completed', priority: 'medium' },
      { name: 'QR Code da loja', status: 'completed', priority: 'low' },
      { name: 'Banners da loja', status: 'completed', priority: 'low' },
    ]
  },

  // ===== DIAGNÓSTICO IA =====
  {
    id: 'ai-diagnosis',
    name: '🤖 Diagnóstico de IA',
    description: 'Hub de inteligência artificial',
    category: 'integration',
    items: [
      { name: '"Aplicar melhorias" gera textos otimizados', status: 'completed', priority: 'high' },
      { name: 'Sugestões de banners e organização', status: 'completed', priority: 'medium' },
      { name: 'Pré-preencher campos para lojista confirmar', status: 'completed', priority: 'medium' },
      { name: 'Relatório estratégico e poético', status: 'completed', priority: 'low' },
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
    description: 'Carrinho abandonado + WhatsApp',
    category: 'integration',
    items: [
      { name: 'Detectar carrinho abandonado', status: 'completed', priority: 'high' },
      { name: 'Programar mensagens WhatsApp automáticas', status: 'completed', priority: 'high' },
      { name: 'Intervalo configurável', status: 'completed', priority: 'medium' },
    ]
  },

  // ===== PERFORMANCE =====
  {
    id: 'performance-optimization',
    name: '⚡ Otimização de Performance',
    description: 'Melhorar desempenho em dispositivos antigos',
    category: 'ux',
    items: [
      { name: 'Lazy loading de rotas com React.lazy', status: 'completed', priority: 'critical' },
      { name: 'Google Fonts: preconnect e otimização', status: 'completed', priority: 'high' },
      { name: 'Skeleton loading universal', status: 'completed', priority: 'high' },
      { name: 'Animações com GPU acceleration', status: 'completed', priority: 'medium' },
      { name: 'Virtualization de listas longas', status: 'pending', priority: 'critical' },
      { name: 'Memoização de componentes pesados', status: 'pending', priority: 'critical' },
      { name: 'Debounce em buscas e filtros', status: 'pending', priority: 'high' },
      { name: 'Image optimization: WebP, srcset, lazy loading', status: 'pending', priority: 'high' },
      { name: 'Prefetch de dados críticos', status: 'pending', priority: 'medium' },
      { name: 'Code splitting por feature', status: 'pending', priority: 'high' },
      { name: 'Marketplace: infinite scroll com virtualization', status: 'pending', priority: 'high' },
    ]
  },

  // ===== FUTURO: PAGSEGURO =====
  {
    id: 'pagseguro-integration',
    name: '💳 Integração PagSeguro (Futuro)',
    description: 'Suporte a pagamentos via PagSeguro',
    category: 'financial',
    items: [
      { name: 'Gateway PagSeguro (estrutura base)', status: 'completed', priority: 'high' },
      { name: 'PIX via PagSeguro API', status: 'pending', priority: 'critical' },
      { name: 'Checkout transparente (cartão)', status: 'pending', priority: 'critical' },
      { name: 'Webhook para confirmação', status: 'pending', priority: 'critical' },
      { name: 'OAuth para conectar contas', status: 'pending', priority: 'high' },
      { name: 'Split de pagamentos', status: 'pending', priority: 'high' },
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

  // ===== DEBUG DE PAGAMENTOS =====
  {
    id: 'payment-debug',
    name: '🐛 Debug de Pagamentos',
    description: 'Corrigir erros de criação de pedido e PIX',
    category: 'financial',
    items: [
      { name: 'Logging detalhado no useCreateOrder', status: 'completed', priority: 'critical' },
      { name: 'Logging detalhado no MercadoPagoGateway', status: 'completed', priority: 'critical' },
      { name: 'Logging detalhado no PixPayment', status: 'completed', priority: 'critical' },
      { name: 'RLS policy para INSERT anon/authenticated em orders', status: 'completed', priority: 'critical' },
      { name: 'Validar establishment tem mercado_pago_token', status: 'completed', priority: 'critical' },
      { name: 'Debug Edge Function mercadopago-pix', status: 'completed', priority: 'critical' },
      { name: 'Fallback para PIX estático quando MP falha', status: 'completed', priority: 'high' },
      { name: 'Testar checkout como usuário anônimo', status: 'pending', priority: 'critical' },
      { name: 'Testar checkout como usuário logado', status: 'pending', priority: 'critical' },
    ]
  },

  // ===== ARQUITETURA HÍBRIDA DE PAGAMENTOS =====
  {
    id: 'hybrid-payment-architecture',
    name: '💳 Arquitetura Híbrida de Pagamentos',
    description: 'PIX Transparente + Checkout Pro para cartões com binary_mode',
    category: 'financial',
    items: [
      // Edge Functions
      { name: 'Edge Function: mercadopago-checkout-pro', status: 'completed', priority: 'critical' },
      { name: 'Checkout Pro com binary_mode: true', status: 'completed', priority: 'critical' },
      { name: 'Checkout Pro com auto_return: approved', status: 'completed', priority: 'critical' },
      { name: 'Exclusão de boleto e lotérica (ticket, atm)', status: 'completed', priority: 'high' },
      { name: 'statement_descriptor: VILA FOOD na fatura', status: 'completed', priority: 'medium' },
      { name: 'external_reference para reconciliação', status: 'completed', priority: 'high' },
      // Tratamento de Erros de Cartão
      { name: 'Mapa de erros cc_rejected_* em errors.ts', status: 'completed', priority: 'critical' },
      { name: 'Mensagens específicas por tipo de rejeição', status: 'completed', priority: 'high' },
      { name: 'Ação sugerida por erro (highlight, suggest_pix, block)', status: 'completed', priority: 'high' },
      // Componentes
      { name: 'Componente CheckoutProPayment', status: 'completed', priority: 'critical' },
      { name: 'Redirecionamento seguro para MP', status: 'completed', priority: 'critical' },
      { name: 'Estados: idle, creating, redirecting, completed, failed', status: 'completed', priority: 'high' },
      // Página de Callback
      { name: 'Página /checkout/resultado', status: 'completed', priority: 'critical' },
      { name: 'Tratamento de success, failure, pending', status: 'completed', priority: 'critical' },
      { name: 'Rota registrada no App.tsx', status: 'completed', priority: 'high' },
      { name: 'Detalhes do pedido e link para acompanhamento', status: 'completed', priority: 'medium' },
      // Integração no Checkout
      { name: 'Integrar CheckoutProPayment no Checkout.tsx', status: 'completed', priority: 'critical' },
      { name: 'Seletor de método: PIX ou Cartão', status: 'completed', priority: 'high' },
      { name: 'Testar fluxo completo em sandbox', status: 'pending', priority: 'critical' },
    ]
  },

  // ===== SELEÇÃO DE GATEWAY NO CHECKOUT =====
  {
    id: 'gateway-selection-checkout',
    name: '💳 Seleção de Gateway no Checkout',
    description: 'Cliente escolhe Mercado Pago ou PagSeguro',
    category: 'financial',
    items: [
      { name: 'Componente GatewaySelector', status: 'completed', priority: 'high' },
      { name: 'Buscar gateways ativos do estabelecimento', status: 'completed', priority: 'high' },
      { name: 'Mostrar opções (MP, PagSeguro) com ícones', status: 'completed', priority: 'high' },
      { name: 'Auto-selecionar se apenas 1 gateway ativo', status: 'completed', priority: 'medium' },
      { name: 'Integrar no Checkout.tsx', status: 'completed', priority: 'high' },
    ]
  },

  // ===== CONFIGURAÇÃO DE GATEWAYS NO ADMIN =====
  {
    id: 'gateway-config-admin',
    name: '⚙️ Configuração de Gateways (Admin)',
    description: 'Admin ativa/desativa gateways da plataforma',
    category: 'admin',
    items: [
      { name: 'Nova aba "Gateways" em AdminSettings', status: 'completed', priority: 'high' },
      { name: 'Switch para Mercado Pago (ativar/desativar)', status: 'completed', priority: 'high' },
      { name: 'Switch para PagSeguro (ativar/desativar)', status: 'completed', priority: 'high' },
      { name: 'Switch para PIX estático (ativar/desativar)', status: 'completed', priority: 'high' },
      { name: 'Switch para dinheiro (ativar/desativar)', status: 'completed', priority: 'high' },
      { name: 'Campos na tabela platform_settings', status: 'completed', priority: 'high' },
      { name: 'Lojista vê gateways disponíveis em EstablishmentSettings', status: 'pending', priority: 'medium' },
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
          <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" /> Concluído
          </Badge>
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
          <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30 text-cyan-700">
            <Bot className="h-3 w-3 mr-1" /> Integração
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {phases.map((phase) => {
          const phaseCompleted = phase.items.filter(i => i.status === 'completed').length;
          const phaseProgress = Math.round((phaseCompleted / phase.items.length) * 100);
          
          return (
            <div 
              key={phase.id} 
              className={`p-4 rounded-lg border ${getCategoryColor(phase.category)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(phase.category)}
                  <div>
                    <h3 className="font-semibold">{phase.name}</h3>
                    <p className="text-xs text-muted-foreground">{phase.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{phaseProgress}%</div>
                  <div className="text-xs text-muted-foreground">
                    {phaseCompleted}/{phase.items.length}
                  </div>
                </div>
              </div>
              
              <Progress value={phaseProgress} className="h-2 mb-3" />
              
              <ul className="space-y-2">
                {phase.items.map((item, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className={item.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                        {item.name}
                      </span>
                    </div>
                    {item.status !== 'completed' && getPriorityBadge(item.priority)}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
