import { 
  Store, 
  CreditCard, 
  MessageSquare, 
  BarChart3, 
  Globe, 
  Bell,
  Palette,
  Truck,
  QrCode
} from "lucide-react";

const features = [
  {
    icon: Store,
    title: "Loja Virtual Própria",
    description: "Subdomínio personalizado para sua marca. Seu cardápio digital profissional em minutos.",
    color: "primary",
  },
  {
    icon: CreditCard,
    title: "Pagamentos Integrados",
    description: "PIX, cartão de crédito, débito e mais. Receba direto na sua conta com total segurança.",
    color: "accent",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp + IA",
    description: "Atendimento automatizado 24/7 com inteligência artificial. Pedidos direto pelo WhatsApp.",
    color: "primary",
  },
  {
    icon: BarChart3,
    title: "Dashboard Completo",
    description: "Acompanhe vendas, produtos mais pedidos, ticket médio e mais em tempo real.",
    color: "accent",
  },
  {
    icon: Globe,
    title: "Marketplace Regional",
    description: "Faça parte do marketplace da sua cidade e alcance mais clientes.",
    color: "primary",
  },
  {
    icon: Bell,
    title: "Notificações em Tempo Real",
    description: "Receba alertas de novos pedidos no celular ou computador instantaneamente.",
    color: "accent",
  },
  {
    icon: Palette,
    title: "Personalização Total",
    description: "Cores, logo, banners e muito mais. Sua identidade visual em cada detalhe.",
    color: "primary",
  },
  {
    icon: Truck,
    title: "Gestão de Entregas",
    description: "Controle taxas por bairro, raio de entrega e tempo estimado facilmente.",
    color: "accent",
  },
  {
    icon: QrCode,
    title: "QR Code & Mesa",
    description: "Atendimento em mesa com QR Code. Ideal para restaurantes e bares.",
    color: "primary",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            Recursos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Tudo que você precisa para{" "}
            <span className="gradient-text">vender mais</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa com todas as ferramentas para gerenciar seu delivery de forma profissional.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${
                  feature.color === "primary"
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/10 text-accent"
                }`}
              >
                <feature.icon size={24} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>

              {/* Hover gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
