import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Store, ShoppingBag, Smartphone } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero pt-20">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Plataforma #1 de Delivery no Brasil
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-up">
              Sua loja de{" "}
              <span className="gradient-text">delivery</span>
              {" "}pronta em minutos
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-up-delayed">
              Crie sua loja virtual com subdomínio próprio, gestão completa de pedidos, 
              integração com pagamentos e atendimento automatizado via WhatsApp com IA.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up-delayed">
              <Button variant="hero" size="xl">
                Criar Minha Loja
                <ArrowRight className="ml-2" />
              </Button>
              <Button variant="glass" size="xl">
                <Play className="mr-2" size={18} />
                Ver Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border/50">
              {[
                { value: "2.500+", label: "Estabelecimentos" },
                { value: "150k+", label: "Pedidos/mês" },
                { value: "99.9%", label: "Uptime" },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right content - Hero illustration */}
          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Main card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 glass rounded-2xl p-6 shadow-elevated animate-float">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <Store className="text-primary-foreground" size={28} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Pizzaria Bella</h3>
                    <p className="text-sm text-muted-foreground">pizzariabella.vilafood.com</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Pedidos Hoje</span>
                    <span className="font-semibold text-foreground">47</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Faturamento</span>
                    <span className="font-semibold text-accent">R$ 3.240</span>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute top-10 right-0 glass rounded-xl p-4 shadow-soft animate-float-delayed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <ShoppingBag className="text-accent" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Novo pedido!</p>
                    <p className="font-semibold text-foreground">R$ 89,90</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-20 left-0 glass rounded-xl p-4 shadow-soft animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Smartphone className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">WhatsApp IA</p>
                    <p className="font-semibold text-foreground">Ativo 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
