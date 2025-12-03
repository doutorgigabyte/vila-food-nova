import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section id="contact" className="py-24 bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
            <Sparkles size={16} />
            14 dias grátis, sem compromisso
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Pronto para{" "}
            <span className="gradient-text">revolucionar</span>
            {" "}seu delivery?
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Junte-se a milhares de estabelecimentos que já transformaram suas vendas com o VilaFood. 
            Comece agora e veja a diferença.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl">
              Criar Minha Loja Grátis
              <ArrowRight className="ml-2" />
            </Button>
            <Button variant="glass" size="xl">
              Agendar Demonstração
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Sem cartão de crédito • Setup em 5 minutos • Suporte em português
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
