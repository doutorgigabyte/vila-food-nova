import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, ArrowRight, Zap, TrendingUp, Smartphone } from "lucide-react";

const BusinessCTABanner = () => {
  return (
    <section className="py-8 md:py-12 px-4">
      <div className="container mx-auto">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-hero-pattern text-white">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-accent/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-24 md:w-48 h-24 md:h-48 bg-accent/15 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative z-10 p-5 sm:p-8 md:p-12 lg:p-16">
            <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-center">
              {/* Content */}
              <div className="space-y-4 md:space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
                  <span>Para Lojistas</span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  Tem um restaurante?{" "}
                  <span className="text-accent">Venda mais</span> com a gente!
                </h2>
                
                <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-lg">
                  Aumente suas vendas com nossa plataforma completa. Cardápio digital, 
                  PDV, gestão de pedidos e muito mais. Tudo em um só lugar!
                </p>
                
                {/* Features */}
                <div className="space-y-3 pt-2 md:pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm sm:text-base">- Taxas</div>
                      <div className="text-xs sm:text-sm text-white/60">Menores do mercado</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Store className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm sm:text-base">+ Pedidos</div>
                      <div className="text-xs sm:text-sm text-white/60">Mais visibilidade</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm sm:text-base">+ Resultados</div>
                      <div className="text-xs sm:text-sm text-white/60">IA integrada</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-2 md:pt-4">
                  <Link to="/conheca" className="w-full sm:w-auto">
                    <Button size="lg" className="btn-yellow w-full group text-sm sm:text-base">
                      Conhecer a Plataforma
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/cadastro-estabelecimento" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full bg-white text-primary hover:bg-white/90 text-sm sm:text-base font-semibold">
                      Começar Grátis
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Visual */}
              <div className="hidden lg:flex justify-center">
                <div className="relative">
                  {/* Phone mockup */}
                  <div className="w-64 h-[480px] bg-gradient-to-b from-white/10 to-white/5 rounded-[3rem] border border-white/20 backdrop-blur-sm p-3 shadow-2xl">
                    <div className="w-full h-full bg-gradient-to-b from-background to-muted rounded-[2.5rem] overflow-hidden">
                      <div className="h-8 bg-primary/10 flex items-center justify-center">
                        <div className="w-16 h-1.5 bg-muted-foreground/30 rounded-full" />
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="h-24 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl animate-pulse" />
                        <div className="grid grid-cols-3 gap-2">
                          <div className="h-16 bg-muted rounded-lg" />
                          <div className="h-16 bg-muted rounded-lg" />
                          <div className="h-16 bg-muted rounded-lg" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-4 bg-muted rounded w-1/2" />
                        </div>
                        <div className="h-20 bg-primary/10 rounded-xl" />
                        <div className="h-20 bg-primary/10 rounded-xl" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-8 w-20 h-20 bg-accent rounded-2xl flex items-center justify-center shadow-yellow animate-float">
                    <span className="text-3xl">🍕</span>
                  </div>
                  <div className="absolute bottom-20 -left-12 w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-elevated animate-float-delayed">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div className="absolute bottom-8 -right-6 w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg animate-float">
                    <span className="text-xl">✓</span>
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

export default BusinessCTABanner;
