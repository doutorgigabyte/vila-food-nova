import { ClipboardList, Settings, Rocket, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Cadastre-se",
    description: "Crie sua conta em menos de 2 minutos. Sem burocracia, sem cartão de crédito.",
  },
  {
    number: "02",
    icon: Settings,
    title: "Configure",
    description: "Adicione seus produtos, defina preços, horários e formas de pagamento.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Lance sua loja",
    description: "Publique e compartilhe seu link personalizado nas redes sociais.",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Venda mais",
    description: "Receba pedidos, acompanhe métricas e cresça seu negócio.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent font-medium text-sm mb-4">
            Como Funciona
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Comece a vender em{" "}
            <span className="gradient-text">4 passos</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simples, rápido e sem complicação. Sua loja online funcionando em minutos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
              )}

              <div className="relative flex flex-col items-center text-center group">
                {/* Step number badge */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-glow z-10">
                  {step.number}
                </div>

                {/* Icon container */}
                <div className="w-32 h-32 rounded-2xl bg-card border border-border flex items-center justify-center mb-6 shadow-soft group-hover:shadow-elevated group-hover:border-primary/30 transition-all duration-300 group-hover:-translate-y-2">
                  <step.icon className="text-primary" size={48} strokeWidth={1.5} />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
