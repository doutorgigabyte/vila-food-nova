import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calculator, TrendingDown, Zap, Shield } from "lucide-react";

const CTASection = () => {
  const scrollToCalculator = () => {
    const element = document.getElementById("calculadora");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Quick savings summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 md:mb-12">
            {[
              { icon: TrendingDown, value: "Até 27%", label: "Economia vs iFood", color: "text-green-500" },
              { icon: Shield, value: "0%", label: "Taxa cardápio digital", color: "text-primary" },
              { icon: Zap, value: "24/7", label: "IA no WhatsApp", color: "text-accent" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 p-4 md:p-5 rounded-xl bg-card/50 border border-border/50"
              >
                <div className="p-2.5 rounded-lg bg-muted/50">
                  <item.icon className={`h-5 w-5 md:h-6 md:w-6 ${item.color}`} />
                </div>
                <div>
                  <p className={`text-lg md:text-xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Main CTA */}
          <div className="text-center">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6">
              Pronto para{" "}
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                economizar
              </span>
              {" "}no seu delivery?
            </h2>

            <p className="text-base md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto">
              Pare de deixar dinheiro na mesa para grandes marketplaces. 
              Crie seu delivery local e invista a economia em crescimento.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cadastro-estabelecimento">
                <Button className="btn-yellow text-base md:text-lg px-6 md:px-8 py-5 md:py-6 h-auto w-full sm:w-auto">
                  Criar Minha Loja Grátis
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <Button 
                onClick={scrollToCalculator}
                variant="outline"
                className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 h-auto w-full sm:w-auto border-primary/30 hover:bg-primary/10"
              >
                <Calculator className="mr-2 h-5 w-5" />
                Calcular Economia
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Sem cartão de crédito • Setup em 5 minutos • Suporte em português
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
