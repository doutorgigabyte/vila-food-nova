import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tv, QrCode, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const mockSlides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
    title: "Pizza Margherita",
    price: "R$ 49,90",
    template: "product_showcase"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop",
    title: "Burger Premium",
    price: "R$ 32,90",
    template: "promo"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&h=600&fit=crop",
    title: "Açaí Especial",
    price: "R$ 24,90",
    template: "minimal"
  }
];

export default function VilaTokTVSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mockSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const slide = mockSlides[currentSlide];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary mb-4"
          >
            <Tv className="w-4 h-4" />
            <span className="text-sm font-medium">Novo: VilaTok TV</span>
            <Sparkles className="w-4 h-4" />
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold mb-4"
          >
            Transforme sua TV em uma
            <span className="text-primary"> vitrine digital</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Exiba seus produtos em televisões com slides automáticos, 
            QR Code integrado e templates profissionais. Tudo sem precisar de login!
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          {/* TV Frame */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="w-full lg:w-3/5"
          >
            <div className="relative">
              {/* TV Frame */}
              <div className="bg-gray-900 rounded-2xl p-3 shadow-2xl">
                <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slide.id}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0"
                    >
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      
                      {/* Product Info */}
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div className="text-white">
                          <h3 className="text-2xl md:text-3xl font-bold">{slide.title}</h3>
                          <p className="text-xl md:text-2xl text-primary font-bold">{slide.price}</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg">
                          <QrCode className="w-12 h-12 md:w-16 md:h-16 text-gray-900" />
                        </div>
                      </div>
                      
                      {/* Logo placeholder */}
                      <div className="absolute top-4 left-4 bg-white/90 rounded-lg px-3 py-1">
                        <span className="font-bold text-gray-900">Sua Logo</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Progress dots */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                    {mockSlides.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentSlide 
                            ? 'w-6 bg-primary' 
                            : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* TV Stand */}
              <div className="flex justify-center">
                <div className="w-32 h-4 bg-gray-800 rounded-b-xl" />
              </div>
              <div className="flex justify-center">
                <div className="w-48 h-2 bg-gray-700 rounded-b-xl" />
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="w-full lg:w-2/5 space-y-6"
          >
            <div className="space-y-4">
              {[
                {
                  title: "Link Público",
                  description: "Acesse em qualquer TV sem precisar fazer login. Basta copiar o link!"
                },
                {
                  title: "Templates Profissionais",
                  description: "Escolha entre diferentes layouts: minimalista, vitrine de produto, promoção..."
                },
                {
                  title: "QR Code Integrado",
                  description: "Seus clientes escaneiam e vão direto para o cardápio digital"
                },
                {
                  title: "Paleta de Cores",
                  description: "Os slides usam as cores da sua marca automaticamente"
                },
                {
                  title: "Responsivo",
                  description: "Ajusta-se perfeitamente a qualquer tamanho de tela"
                }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <ArrowRight className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button asChild size="lg" className="w-full md:w-auto">
              <Link to="/cadastrar-estabelecimento">
                Começar agora
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}