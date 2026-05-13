import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Store, Calculator, Zap, TrendingDown, Shield, Smartphone } from "lucide-react";
import { useLandingAnalytics, useSectionView } from "@/hooks/useLandingAnalytics";

const HeroSection = () => {
  const { trackCTAClick, trackSignupIntent } = useLandingAnalytics();
  const sectionRef = useSectionView("hero");

  const scrollToCalculator = () => {
    trackCTAClick({ ctaText: "Calcular Minha Economia", ctaLocation: "hero", destination: "#calculadora" });
    const element = document.getElementById("calculadora");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCreateStore = () => {
    trackCTAClick({ ctaText: "Criar Minha Loja Gratis", ctaLocation: "hero", destination: "/cadastro-estabelecimento" });
    trackSignupIntent("hero");
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-pattern pt-12 md:pt-16">
      {/* Animated background rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-full bg-[radial-gradient(ellipse_at_top,_transparent_0%,_hsl(0_0%_0%_/_0.1)_100%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-destructive/20 backdrop-blur-sm text-white font-medium text-xs md:text-sm mb-4 md:mb-6 animate-fade-up border border-destructive/30">
              <TrendingDown className="w-3 h-3 md:w-4 md:h-4 text-destructive" />
              Economize até 27% em taxas
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-4 md:mb-6 animate-fade-up">
              Pare de pagar{" "}
              <span className="text-accent">taxas abusivas</span>
              {" "}para marketplaces
            </h1>

            <p className="text-base md:text-xl text-white/80 mb-6 md:mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-up-delayed">
              Crie seu próprio delivery local com subdomínio exclusivo, gestão completa, 
              pagamentos integrados e atendimento 24/7 via WhatsApp com IA.
              <span className="block mt-2 text-accent font-semibold">
                Mesmo serviço. Fração do custo.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start animate-fade-up-delayed">
              <Button 
                onClick={scrollToCalculator}
                className="bg-destructive hover:bg-destructive/90 text-white text-base md:text-lg px-6 md:px-8 py-5 md:py-6 h-auto group w-full sm:w-auto"
              >
                <Calculator className="mr-2 h-5 w-5" />
                Calcular Minha Economia
              </Button>
              <Link to="/cadastro-estabelecimento" onClick={handleCreateStore}>
                <Button
                  className="btn-yellow text-base md:text-lg px-6 md:px-8 py-5 md:py-6 h-auto group w-full sm:w-auto"
                >
                  Criar Minha Loja Grátis
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Stats - Focused on savings */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/20">
              {[
                { value: "0%", label: "Taxa por Pedido", icon: Shield },
                { value: "5%", label: "Apenas Marketplace", icon: Store },
                { value: "24/7", label: "IA WhatsApp", icon: Smartphone },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                    <div className="text-xl md:text-3xl font-bold text-accent">{stat.value}</div>
                  </div>
                  <div className="text-xs md:text-sm text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right content - Savings illustration */}
          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Main comparison card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-2xl p-6 shadow-elevated animate-float">
                <h3 className="font-bold text-foreground text-lg mb-4 text-center">
                  Se você vende R$ 30.000/mês
                </h3>
                
                {/* iFood cost */}
                <div className="p-4 bg-destructive/10 rounded-xl mb-3 border border-destructive/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">iFood leva:</span>
                    <span className="font-bold text-destructive text-xl">-R$ 7.860</span>
                  </div>
                  <div className="text-xs text-destructive/70">23% + 3.2% + mensalidade</div>
                </div>
                
                {/* VilaFood cost */}
                <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">VilaFood leva:</span>
                    <span className="font-bold text-green-600 text-xl">-R$ 1.667</span>
                  </div>
                  <div className="text-xs text-green-600/70">5% + R$1 por pedido</div>
                </div>
                
                {/* Savings */}
                <div className="mt-4 p-3 bg-accent/20 rounded-xl text-center">
                  <span className="text-foreground font-bold text-lg">
                    Você economiza: <span className="text-primary">R$ 6.193/mês</span>
                  </span>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute top-10 right-0 bg-white rounded-xl p-4 shadow-elevated animate-float-delayed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                    <TrendingDown className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Economia anual</p>
                    <p className="font-bold text-green-600">R$ 74.316</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-20 left-0 bg-white rounded-xl p-4 shadow-elevated animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                    <Store className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Seu domínio</p>
                    <p className="font-semibold text-foreground text-sm">.vilafood.delivery</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 bg-accent rounded-xl p-4 shadow-yellow animate-float-delayed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Zap className="text-foreground" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-foreground/70">Marketplace Local</p>
                    <p className="font-semibold text-foreground">Sua cidade!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave decoration at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 md:h-24 bg-background" style={{ clipPath: 'ellipse(60% 100% at 50% 100%)' }} />
    </section>
  );
};

export default HeroSection;
