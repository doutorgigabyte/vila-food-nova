import { useState } from "react";
import { 
  Video, MessageSquare, ChefHat, Wallet, CreditCard, Smartphone, Truck, BarChart3
} from "lucide-react";
import PhoneFrame from "./features/PhoneFrame";
import VilaTokSimulation from "./features/VilaTokSimulation";
import WhatsAppSimulation from "./features/WhatsAppSimulation";
import KDSSimulation from "./features/KDSSimulation";
import PaymentSimulation from "./features/PaymentSimulation";
import PDVSimulation from "./features/PDVSimulation";
import MenuSimulation from "./features/MenuSimulation";
import DeliverySimulation from "./features/DeliverySimulation";
import ReportsSimulation from "./features/ReportsSimulation";

interface FeatureTab {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  simulation: React.ReactNode;
  features: { title: string; description: string }[];
}

const featureTabs: FeatureTab[] = [
  {
    id: "vilatok",
    icon: Video,
    label: "VilaTok",
    color: "from-pink-500 to-rose-500",
    simulation: <VilaTokSimulation />,
    features: [
      { title: "Stories interativos", description: "Vídeos curtos do seu negócio" },
      { title: "Compra direto do vídeo", description: "Cliente adiciona ao carrinho" },
      { title: "Alcance local", description: "Apareça para clientes da região" },
    ],
  },
  {
    id: "whatsapp",
    icon: MessageSquare,
    label: "WhatsApp IA",
    color: "from-green-500 to-emerald-500",
    simulation: <WhatsAppSimulation />,
    features: [
      { title: "Atendimento 24/7", description: "IA que nunca dorme" },
      { title: "Envia fotos dos produtos", description: "Cardápio visual no chat" },
      { title: "Processa pedidos", description: "Do cardápio ao pagamento" },
    ],
  },
  {
    id: "kds",
    icon: ChefHat,
    label: "Cozinha",
    color: "from-orange-500 to-red-500",
    simulation: <KDSSimulation />,
    features: [
      { title: "Pedidos em tempo real", description: "Notificação instantânea" },
      { title: "Cronômetro de preparo", description: "Controle de tempo" },
      { title: "Status por pedido", description: "Novo → Preparando → Pronto" },
    ],
  },
  {
    id: "pagamentos",
    icon: Wallet,
    label: "Pagamentos",
    color: "from-yellow-500 to-orange-500",
    simulation: <PaymentSimulation />,
    features: [
      { title: "PIX dinâmico", description: "QR Code automático" },
      { title: "Entrega Turbo", description: "15 min com taxa premium" },
      { title: "Multi-gateway", description: "MP, PagSeguro, mais" },
    ],
  },
  {
    id: "pdv",
    icon: CreditCard,
    label: "PDV",
    color: "from-emerald-500 to-teal-500",
    simulation: <PDVSimulation />,
    features: [
      { title: "Vendas no balcão", description: "Interface rápida" },
      { title: "Controle de caixa", description: "Abertura e fechamento" },
      { title: "Múltiplos pagamentos", description: "PIX, cartão, dinheiro" },
    ],
  },
  {
    id: "cardapio",
    icon: Smartphone,
    label: "Cardápio",
    color: "from-blue-500 to-cyan-500",
    simulation: <MenuSimulation />,
    features: [
      { title: "Subdomínio próprio", description: "sualoja.vilafood.delivery" },
      { title: "QR Code para mesa", description: "Peça sem garçom" },
      { title: "Fotos e categorias", description: "Menu organizado" },
    ],
  },
  {
    id: "delivery",
    icon: Truck,
    label: "Entregas",
    color: "from-purple-500 to-pink-500",
    simulation: <DeliverySimulation />,
    features: [
      { title: "Rastreamento ao vivo", description: "Mapa em tempo real" },
      { title: "Status do pedido", description: "Cliente acompanha tudo" },
      { title: "Chat com motoboy", description: "Comunicação direta" },
    ],
  },
  {
    id: "relatorios",
    icon: BarChart3,
    label: "Relatórios",
    color: "from-indigo-500 to-blue-500",
    simulation: <ReportsSimulation />,
    features: [
      { title: "Vendas em tempo real", description: "Dashboard ao vivo" },
      { title: "Produtos top", description: "Mais vendidos" },
      { title: "Horários de pico", description: "Quando mais vende" },
    ],
  },
];

const AllFeaturesSection = () => {
  const [activeTab, setActiveTab] = useState(featureTabs[0].id);
  const currentTab = featureTabs.find((t) => t.id === activeTab) || featureTabs[0];

  return (
    <section className="py-12 md:py-20 relative overflow-hidden" id="funcionalidades">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
            Veja na{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              prática
            </span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Simulações reais de cada funcionalidade da plataforma
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-4 mb-6 md:mb-8 scrollbar-hide justify-start md:justify-center -mx-4 px-4 md:mx-0 md:px-0">
          {featureTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-card/50 text-muted-foreground border border-border hover:border-primary/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content: Phone + Features */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-10 max-w-5xl mx-auto">
          {/* Phone Frame */}
          <div className="flex-shrink-0">
            <PhoneFrame className="w-[260px] md:w-[300px]">
              {currentTab.simulation}
            </PhoneFrame>
          </div>

          {/* Features Grid */}
          <div className="flex-1 w-full">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${currentTab.color} mb-4`}>
              <currentTab.icon className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">{currentTab.label}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentTab.features.map((feature, i) => (
                <div
                  key={feature.title}
                  className="p-4 bg-card/50 rounded-xl border border-border/50 hover:border-primary/30 transition-all"
                >
                  <h4 className="text-foreground font-semibold text-sm mb-1">{feature.title}</h4>
                  <p className="text-muted-foreground text-xs">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { value: "8+", label: "Módulos" },
                { value: "24/7", label: "Suporte" },
                { value: "100%", label: "Brasileiro" },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-3 bg-card/30 rounded-xl border border-border/30">
                  <div className="text-xl md:text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</div>
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
