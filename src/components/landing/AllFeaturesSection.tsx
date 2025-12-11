import { useState } from "react";
import { 
  Smartphone, 
  ChefHat, 
  CreditCard, 
  Truck, 
  BarChart3, 
  Wallet, 
  MessageSquare, 
  Video,
  QrCode,
  Layers,
  Image,
  Settings2,
  Bell,
  Printer,
  MapPin,
  Users,
  TrendingUp,
  Clock,
  Bot,
  Send,
  Play,
  Heart,
  Check
} from "lucide-react";

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface FeatureCategory {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  features: Feature[];
}

const categories: FeatureCategory[] = [
  {
    id: "cardapio",
    icon: Smartphone,
    title: "Cardápio Digital",
    description: "Sua vitrine online completa",
    color: "from-blue-500 to-cyan-500",
    features: [
      { icon: QrCode, title: "Subdomínio Próprio", description: "suaempresa.vilafood.delivery exclusivo" },
      { icon: QrCode, title: "QR Code para Mesa", description: "Clientes pedem direto da mesa" },
      { icon: Layers, title: "Categorias Ilimitadas", description: "Organize produtos por seções" },
      { icon: Image, title: "Fotos HD", description: "Upload de imagens em alta qualidade" },
      { icon: Settings2, title: "Variações", description: "Tamanhos, sabores, adicionais" },
    ],
  },
  {
    id: "kds",
    icon: ChefHat,
    title: "Gestão de Cozinha (KDS)",
    description: "Controle total da produção",
    color: "from-orange-500 to-red-500",
    features: [
      { icon: ChefHat, title: "Display de Pedidos", description: "Tela dedicada para a cozinha" },
      { icon: Clock, title: "Tempo de Preparo", description: "Cronômetro por pedido" },
      { icon: Bell, title: "Alertas Sonoros", description: "Notificação de novos pedidos" },
      { icon: Printer, title: "Impressão Automática", description: "Comandas direto na impressora" },
    ],
  },
  {
    id: "pdv",
    icon: CreditCard,
    title: "PDV (Ponto de Venda)",
    description: "Vendas no balcão simplificadas",
    color: "from-green-500 to-emerald-500",
    features: [
      { icon: CreditCard, title: "Vendas Rápidas", description: "Interface otimizada para balcão" },
      { icon: Wallet, title: "Controle de Caixa", description: "Abertura e fechamento" },
      { icon: TrendingUp, title: "Sangria/Suprimento", description: "Movimentações de caixa" },
      { icon: BarChart3, title: "Relatório de Turno", description: "Fechamento detalhado" },
    ],
  },
  {
    id: "delivery",
    icon: Truck,
    title: "Gestão de Entregas",
    description: "Logística inteligente",
    color: "from-purple-500 to-pink-500",
    features: [
      { icon: Users, title: "Cadastro de Motoboys", description: "Equipe própria organizada" },
      { icon: MapPin, title: "Taxas por Região", description: "Bairro, distância ou zona" },
      { icon: MapPin, title: "Rastreamento", description: "Localização em tempo real" },
      { icon: TrendingUp, title: "Métricas", description: "Desempenho dos entregadores" },
    ],
  },
  {
    id: "relatorios",
    icon: BarChart3,
    title: "Relatórios & Analytics",
    description: "Dados para decisões inteligentes",
    color: "from-indigo-500 to-blue-500",
    features: [
      { icon: BarChart3, title: "Vendas por Período", description: "Diário, semanal, mensal" },
      { icon: TrendingUp, title: "Produtos Top", description: "Mais vendidos e lucrativos" },
      { icon: Wallet, title: "Ticket Médio", description: "Valor médio por pedido" },
      { icon: Clock, title: "Horários de Pico", description: "Quando mais vende" },
    ],
  },
  {
    id: "pagamentos",
    icon: Wallet,
    title: "Pagamentos",
    description: "Receba de todas as formas",
    color: "from-yellow-500 to-orange-500",
    features: [
      { icon: QrCode, title: "PIX Dinâmico", description: "QR Code automático" },
      { icon: CreditCard, title: "Cartão Online", description: "Crédito e débito" },
      { icon: Wallet, title: "Dinheiro/Maquininha", description: "Na entrega" },
      { icon: Users, title: "Split Payment", description: "Multi-loja automático" },
    ],
  },
  {
    id: "whatsapp",
    icon: MessageSquare,
    title: "WhatsApp + IA",
    description: "Atendimento 24/7 automatizado",
    color: "from-green-500 to-teal-500",
    features: [
      { icon: Bot, title: "Chatbot Inteligente", description: "IA que entende o cliente" },
      { icon: Send, title: "Pedidos Automáticos", description: "Recebe e processa pedidos" },
      { icon: Image, title: "Envio de Fotos", description: "Cardápio visual no chat" },
      { icon: Bell, title: "Notificações", description: "Status do pedido automático" },
    ],
  },
  {
    id: "vilatok",
    icon: Video,
    title: "VilaTok Stories",
    description: "Rede social integrada",
    color: "from-pink-500 to-rose-500",
    features: [
      { icon: Play, title: "Stories", description: "Vídeos curtos do seu negócio" },
      { icon: Heart, title: "Engajamento", description: "Curtidas e compartilhamentos" },
      { icon: Users, title: "Alcance Local", description: "Visibilidade na região" },
      { icon: TrendingUp, title: "Conversões", description: "Stories que vendem" },
    ],
  },
];

const AllFeaturesSection = () => {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);

  const currentCategory = categories.find((c) => c.id === activeCategory) || categories[0];

  return (
    <section className="py-12 md:py-20 lg:py-32 relative overflow-hidden" id="funcionalidades">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 md:mb-6">
            <Settings2 className="h-3 w-3 md:h-4 md:w-4 text-primary" />
            <span className="text-xs md:text-sm font-medium text-primary">Sistema Completo</span>
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
            Tudo que você precisa em{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              um só lugar
            </span>
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Do cardápio digital ao atendimento via WhatsApp com IA, 
            temos todas as ferramentas para seu negócio crescer
          </p>
        </div>

        {/* Category Tabs - Horizontal scroll on mobile */}
        <div className="mb-8 md:mb-12 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 md:pb-0 md:flex-wrap md:justify-center scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-full border transition-all whitespace-nowrap ${
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                    : "bg-card/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <category.icon className="h-4 w-4" />
                <span className="text-xs md:text-sm font-medium">{category.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Category Content */}
        <div className="max-w-5xl mx-auto">
          <div 
            key={currentCategory.id}
            className="animate-fade-up"
          >
            {/* Category Header */}
            <div className="text-center mb-8 md:mb-10">
              <div className={`inline-flex p-4 md:p-5 rounded-2xl md:rounded-3xl bg-gradient-to-br ${currentCategory.color} mb-4 md:mb-6 shadow-lg`}>
                <currentCategory.icon className="h-8 w-8 md:h-12 md:w-12 text-white" />
              </div>
              <h3 className="text-xl md:text-3xl font-bold text-foreground mb-2">
                {currentCategory.title}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground">
                {currentCategory.description}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {currentCategory.features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="group p-4 md:p-6 rounded-xl md:rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card transition-all"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`inline-flex p-2.5 md:p-3 rounded-xl bg-gradient-to-br ${currentCategory.color} bg-opacity-20 mb-3 md:mb-4`}>
                    <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1 text-sm md:text-base">
                    {feature.title}
                  </h4>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Summary */}
        <div className="mt-12 md:mt-16">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { value: "8+", label: "Módulos Integrados" },
              { value: "30+", label: "Funcionalidades" },
              { value: "24/7", label: "Suporte" },
              { value: "100%", label: "Em Português" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-4 md:p-6 rounded-xl md:rounded-2xl bg-card/30 border border-border/30"
              >
                <div className="text-2xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Features Checkmark List */}
        <div className="mt-12 md:mt-16 max-w-4xl mx-auto">
          <div className="p-6 md:p-8 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
            <h4 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6 text-center">
              Tudo incluso em todos os planos:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {[
                "Cardápio Digital Ilimitado",
                "Subdomínio Personalizado",
                "Gestão de Pedidos",
                "Múltiplas Formas de Pagamento",
                "Relatórios de Vendas",
                "Suporte via WhatsApp",
                "App Mobile (PWA)",
                "Notificações em Tempo Real",
                "Integração PIX",
                "Controle de Estoque Básico",
                "Cupons de Desconto",
                "Horários de Funcionamento",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-500" />
                  </div>
                  <span className="text-xs md:text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AllFeaturesSection;
