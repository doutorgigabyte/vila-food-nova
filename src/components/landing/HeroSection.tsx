import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Store, ShoppingBag, Smartphone, MessageCircle, Zap, TrendingUp } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-pattern pt-20">
      {/* Animated background rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-full bg-[radial-gradient(ellipse_at_top,_transparent_0%,_hsl(0_0%_0%_/_0.1)_100%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white font-medium text-sm mb-6 animate-fade-up border border-white/20">
              <Zap className="w-4 h-4 text-accent" />
              Delivery local também é inovação!
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 animate-fade-up">
              Sua loja de{" "}
              <span className="text-accent">delivery</span>
              {" "}pronta em minutos
            </h1>

            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-up-delayed">
              Crie sua loja virtual com subdomínio próprio, gestão completa de pedidos, 
              integração com pagamentos e atendimento automatizado via WhatsApp com IA.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up-delayed">
              <Link to="/cadastro-estabelecimento">
                <Button className="btn-yellow text-lg px-8 py-6 h-auto group">
                  Criar Minha Loja Grátis
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 h-auto">
                  <Store className="mr-2" size={18} />
                  Ver Lojas
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
              {[
                { value: "20+", label: "Estabelecimentos" },
                { value: "1k+", label: "Pedidos/mês" },
                { value: "24/7", label: "IA Ativa" },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-accent">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right content - Hero illustration */}
          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Main card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-2xl p-6 shadow-elevated animate-float">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
                    <Store className="text-white" size={28} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Pizzaria Bella</h3>
                    <p className="text-sm text-muted-foreground">pizzariabella.vilafood.com</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Pedidos Hoje</span>
                    <span className="font-semibold text-foreground">47</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                    <span className="text-sm text-muted-foreground">Faturamento</span>
                    <span className="font-semibold text-primary">R$ 3.240</span>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute top-10 right-0 bg-white rounded-xl p-4 shadow-elevated animate-float-delayed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                    <TrendingUp className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vendas +32%</p>
                    <p className="font-semibold text-foreground">Este mês</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-20 left-0 bg-white rounded-xl p-4 shadow-elevated animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                    <MessageCircle className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">WhatsApp IA</p>
                    <p className="font-semibold text-foreground">Ativo 24/7</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 bg-accent rounded-xl p-4 shadow-yellow animate-float-delayed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <ShoppingBag className="text-foreground" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/70">Novo pedido!</p>
                    <p className="font-semibold text-foreground">R$ 89,90</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave decoration at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-background" style={{ clipPath: 'ellipse(60% 100% at 50% 100%)' }} />
    </section>
  );
};

export default HeroSection;
