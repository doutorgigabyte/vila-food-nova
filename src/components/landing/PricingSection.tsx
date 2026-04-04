import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Star, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePlans, type Plan } from "@/hooks/usePlans";
import { cn } from "@/lib/utils";

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const { data: plans, isLoading } = usePlans();

  const getPrice = (plan: Plan) => {
    if (plan.price === 0) return "0";
    const price = isYearly ? (plan.price_yearly || plan.price * 12 * 0.8) : (plan.price_monthly || plan.price);
    return price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(".", ",");
  };

  const getPeriod = (plan: Plan) => {
    if (plan.price === 0) return "";
    return isYearly ? "/mês*" : "/mês";
  };

  const getCTA = (plan: Plan) => {
    if (plan.price === 0) return "Começar Grátis";
    if (plan.is_popular) return "Escolher Plano";
    return "Selecionar";
  };

  const getSubtitle = (plan: Plan) => {
    switch (plan.slug) {
      case "gratuito": return "Para começar";
      case "starter": return "Para crescer";
      case "pro": return "O mais escolhido";
      case "business": return "Para redes";
      default: return plan.description || "";
    }
  };

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
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4 mb-8">
            Sem taxas escondidas. Cancele quando quiser. Comece grátis hoje.
          </p>

          {/* Toggle Mensal/Anual */}
          <div className="flex items-center justify-center gap-4">
            <Label 
              htmlFor="pricing-toggle" 
              className={cn(
                "cursor-pointer transition-colors",
                !isYearly ? "font-semibold text-foreground" : "text-muted-foreground"
              )}
            >
              Mensal
            </Label>
            <Switch
              id="pricing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label 
              htmlFor="pricing-toggle" 
              className={cn(
                "cursor-pointer transition-colors",
                isYearly ? "font-semibold text-foreground" : "text-muted-foreground"
              )}
            >
              Anual
              <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/10 text-green-600 rounded-full font-medium">
                -20%
              </span>
            </Label>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans?.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "relative p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2",
                  plan.is_popular
                    ? "bg-gradient-dark text-white shadow-elevated lg:scale-105 z-10"
                    : "bg-card border border-border hover:shadow-elevated"
                )}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-glow whitespace-nowrap">
                    <Star size={12} fill="currentColor" />
                    Mais Popular
                  </div>
                )}

                <div className="mb-4">
                  <h3 className={cn("text-lg font-semibold mb-1", plan.is_popular ? "text-white" : "text-foreground")}>
                    {plan.name}
                  </h3>
                  <p className={cn("text-xs", plan.is_popular ? "text-white/70" : "text-muted-foreground")}>
                    {getSubtitle(plan)}
                  </p>
                </div>

                <div className="mb-4">
                  <span className={cn("text-4xl font-bold", plan.is_popular ? "text-white" : "text-foreground")}>
                    R${getPrice(plan)}
                  </span>
                  <span className={cn("text-sm", plan.is_popular ? "text-white/70" : "text-muted-foreground")}>
                    {getPeriod(plan)}
                  </span>
                  {isYearly && plan.price > 0 && (
                    <p className={cn("text-xs mt-1", plan.is_popular ? "text-green-300" : "text-green-600")}>
                      *cobrado anualmente
                    </p>
                  )}
                </div>

                {/* Limites principais */}
                <div className={cn(
                  "mb-4 pb-4 border-b text-xs space-y-1",
                  plan.is_popular ? "border-white/20 text-white/80" : "border-border text-muted-foreground"
                )}>
                  <div className="flex justify-between">
                    <span>Produtos</span>
                    <span className="font-medium">{plan.max_products === -1 ? "Ilimitado" : plan.max_products}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pedidos/mês</span>
                    <span className="font-medium">{plan.max_orders === -1 ? "Ilimitado" : plan.max_orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vídeos</span>
                    <span className="font-medium">{plan.max_videos === -1 ? "Ilimitado" : plan.max_videos}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {(plan.features || []).slice(0, 6).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        plan.is_popular ? "bg-white/20" : "bg-accent/20"
                      )}>
                        <Check size={10} className={plan.is_popular ? "text-white" : "text-accent"} />
                      </div>
                      <span className={cn("text-xs leading-relaxed", plan.is_popular ? "text-white/90" : "text-muted-foreground")}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link to="/cadastro-estabelecimento">
                  <Button
                    variant={plan.is_popular ? "hero" : "outline"}
                    className={cn("w-full", !plan.is_popular && "hover:bg-primary hover:text-primary-foreground")}
                    size="lg"
                  >
                    {getCTA(plan)}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:mt-12 space-y-2">
          <p className="text-sm text-muted-foreground">
            Taxa de marketplace: apenas 5% + R$1 por pedido no marketplace
          </p>
          <p className="text-sm text-muted-foreground">
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
