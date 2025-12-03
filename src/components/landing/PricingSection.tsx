import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Perfeito para começar",
    price: "79",
    period: "/mês",
    features: [
      "Até 50 produtos",
      "Subdomínio personalizado",
      "Gestão de pedidos",
      "PIX integrado",
      "Suporte por e-mail",
    ],
    cta: "Começar Agora",
    popular: false,
  },
  {
    name: "Profissional",
    description: "O mais escolhido",
    price: "149",
    period: "/mês",
    features: [
      "Produtos ilimitados",
      "WhatsApp com IA",
      "Múltiplas formas de pagamento",
      "Cupons de desconto",
      "Relatórios avançados",
      "Suporte prioritário",
      "Marketplace da cidade",
    ],
    cta: "Escolher Plano",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Para grandes operações",
    price: "299",
    period: "/mês",
    features: [
      "Tudo do Profissional",
      "Multi-lojas",
      "API personalizada",
      "Gerente de conta dedicado",
      "Treinamento da equipe",
      "SLA garantido",
      "White-label disponível",
    ],
    cta: "Falar com Vendas",
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
            Planos & Preços
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Escolha o plano{" "}
            <span className="gradient-text">ideal</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sem taxas escondidas. Cancele quando quiser. Comece grátis por 14 dias.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 ${
                plan.popular
                  ? "bg-gradient-dark text-white shadow-elevated scale-105"
                  : "bg-card border border-border hover:shadow-elevated"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5 shadow-glow">
                  <Star size={14} fill="currentColor" />
                  Mais Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-semibold mb-1 ${plan.popular ? "text-white" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className={`text-5xl font-bold ${plan.popular ? "text-white" : "text-foreground"}`}>
                  R${plan.price}
                </span>
                <span className={`text-lg ${plan.popular ? "text-white/70" : "text-muted-foreground"}`}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.popular ? "bg-white/20" : "bg-accent/20"
                    }`}>
                      <Check size={12} className={plan.popular ? "text-white" : "text-accent"} />
                    </div>
                    <span className={`text-sm ${plan.popular ? "text-white/90" : "text-muted-foreground"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "hero" : "outline"}
                className={`w-full ${plan.popular ? "" : "hover:bg-primary hover:text-primary-foreground"}`}
                size="lg"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Precisa de um plano customizado?{" "}
            <a href="#contact" className="text-primary font-semibold hover:underline">
              Fale conosco
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
