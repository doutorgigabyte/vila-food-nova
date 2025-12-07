import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Star, Loader2 } from "lucide-react";
import { usePlans } from "@/hooks/usePlans";

const defaultFeatures = {
  grátis: [
    "Até 50 produtos",
    "Subdomínio personalizado",
    "Gestão de pedidos",
    "QR Code do cardápio",
    "Suporte por e-mail",
  ],
  mensal: [
    "Produtos ilimitados",
    "WhatsApp com IA",
    "PIX integrado",
    "Cupons de desconto",
    "Banners promocionais",
    "Relatórios básicos",
    "Marketplace da cidade",
  ],
  anual: [
    "Tudo do Mensal",
    "Pedidos ilimitados",
    "Relatórios avançados",
    "Suporte prioritário",
    "Multi-funcionários",
    "VilaTok Stories",
    "Economia de 30%",
  ],
};

const PricingSection = () => {
  const { data: plans, isLoading } = usePlans();

  // Map plans from database to display format
  const getDisplayPlans = () => {
    if (!plans || plans.length === 0) {
      return [
        { name: "Grátis", price: "0", period: "/mês", features: defaultFeatures.grátis, popular: false, cta: "Começar Grátis" },
        { name: "Mensal", price: "49,90", period: "/mês", features: defaultFeatures.mensal, popular: true, cta: "Escolher Plano" },
        { name: "Anual", price: "419", period: "/ano", features: defaultFeatures.anual, popular: false, cta: "Economizar 30%" },
      ];
    }

    return plans.slice(0, 3).map((plan) => {
      const nameLower = plan.name.toLowerCase();
      const isPopular = nameLower === "mensal";
      const isAnnual = nameLower === "anual";
      const isFree = plan.price === 0;

      return {
        name: plan.name,
        price: plan.price === 0 ? "0" : plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).replace('.', ','),
        period: isAnnual ? "/ano" : "/mês",
        features: plan.features || defaultFeatures[nameLower as keyof typeof defaultFeatures] || defaultFeatures.mensal,
        popular: isPopular,
        cta: isFree ? "Começar Grátis" : isAnnual ? "Economizar 30%" : "Escolher Plano",
      };
    });
  };

  const displayPlans = getDisplayPlans();

  return (
    <section id="pricing" className="py-16 md:py-24 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-10 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            Planos & Preços
          </span>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Escolha o plano{" "}
            <span className="gradient-text">ideal</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Sem taxas escondidas. Cancele quando quiser. Comece grátis hoje.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {displayPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative p-6 md:p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular
                    ? "bg-gradient-dark text-white shadow-elevated md:scale-105 order-first md:order-none"
                    : "bg-card border border-border hover:shadow-elevated"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-gradient-primary text-primary-foreground text-xs md:text-sm font-semibold flex items-center gap-1.5 shadow-glow whitespace-nowrap">
                    <Star size={12} fill="currentColor" />
                    Mais Popular
                  </div>
                )}

                <div className="mb-4 md:mb-6">
                  <h3 className={`text-lg md:text-xl font-semibold mb-1 ${plan.popular ? "text-white" : "text-foreground"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs md:text-sm ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>
                    {plan.name === "Grátis" ? "Para começar" : plan.name === "Mensal" ? "O mais escolhido" : "Melhor economia"}
                  </p>
                </div>

                <div className="mb-4 md:mb-6">
                  <span className={`text-4xl md:text-5xl font-bold ${plan.popular ? "text-white" : "text-foreground"}`}>
                    R${plan.price}
                  </span>
                  <span className={`text-base md:text-lg ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 md:gap-3">
                      <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.popular ? "bg-white/20" : "bg-accent/20"
                      }`}>
                        <Check size={10} className={plan.popular ? "text-white" : "text-accent"} />
                      </div>
                      <span className={`text-xs md:text-sm leading-relaxed ${plan.popular ? "text-white/90" : "text-muted-foreground"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link to="/cadastro-estabelecimento">
                  <Button
                    variant={plan.popular ? "hero" : "outline"}
                    className={`w-full ${plan.popular ? "" : "hover:bg-primary hover:text-primary-foreground"}`}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:mt-12">
          <p className="text-sm md:text-base text-muted-foreground">
            Precisa de um plano customizado?{" "}
            <a href="https://wa.me/5581999999999" className="text-primary font-semibold hover:underline">
              Fale conosco
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
