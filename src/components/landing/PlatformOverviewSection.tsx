import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Target, Eye, Heart, Zap, Building2, ShoppingBag, Bot, Users } from "lucide-react";

const values = [
  { icon: Zap, title: "Simplicidade", description: "Tecnologia acessível para todos" },
  { icon: Target, title: "Inovação", description: "Sempre à frente do mercado" },
  { icon: Heart, title: "Parceria", description: "Seu sucesso é nosso sucesso" },
  { icon: Users, title: "Comunidade", description: "Fortalecendo o comércio local" },
];

const stats = [
  { icon: Building2, value: 20, suffix: "+", label: "Estabelecimentos" },
  { icon: ShoppingBag, value: 500, suffix: "+", label: "Produtos" },
  { icon: Bot, value: 24, suffix: "/7", label: "IA Ativa" },
  { icon: Users, value: 100, suffix: "%", label: "Satisfação" },
];

const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}{suffix}
    </span>
  );
};

const PlatformOverviewSection = () => {
  return (
    <section className="py-12 md:py-20 lg:py-32 relative overflow-hidden" id="sobre">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-muted/50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-accent/10 border border-accent/20 mb-4 md:mb-6">
              <Building2 className="h-3 w-3 md:h-4 md:w-4 text-accent" />
              <span className="text-xs md:text-sm font-medium text-accent">Sobre a Plataforma</span>
            </div>

            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
              Nascemos para{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Revolucionar
              </span>{" "}
              o Delivery Local
            </h2>

            <div className="space-y-3 md:space-y-4 text-muted-foreground text-sm md:text-lg leading-relaxed mb-6 md:mb-8">
              <p>
                <strong className="text-foreground">VilaFood</strong> nasceu em Tamandaré-PE com uma missão clara: 
                democratizar a tecnologia para pequenos negócios e transformar a forma como as comunidades 
                locais consomem e vendem.
              </p>
              <p className="hidden md:block">
                Acreditamos que todo empreendedor merece acesso às mesmas ferramentas que grandes redes utilizam, 
                sem precisar pagar taxas abusivas ou depender de plataformas que não entendem a realidade local.
              </p>
            </div>

            {/* Mission & Vision */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="p-4 md:p-5 rounded-xl bg-card/50 backdrop-blur border border-border/50">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
                    <Target className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm md:text-base">Missão</h3>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Democratizar tecnologia para pequenos negócios, tornando o delivery acessível a todos.
                </p>
              </div>
              <div className="p-4 md:p-5 rounded-xl bg-card/50 backdrop-blur border border-border/50">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2 rounded-lg bg-accent/10">
                    <Eye className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm md:text-base">Visão</h3>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Ser a maior rede de delivery regional do Brasil, conectando comunidades.
                </p>
              </div>
            </div>

            {/* Values */}
            <div className="flex flex-wrap gap-2 md:gap-3">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <value.icon className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                  <span className="text-xs md:text-sm font-medium text-foreground">{value.title}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Stats */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 rounded-3xl blur-3xl" />
            
            <div className="relative grid grid-cols-2 gap-3 md:gap-4 lg:gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="group relative p-4 md:p-6 lg:p-8 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10">
                    <div className="inline-flex p-2 md:p-3 rounded-xl bg-gradient-to-br from-primary to-accent mb-3 md:mb-4">
                      <stat.icon className="h-4 w-4 md:h-6 md:w-6 text-white" />
                    </div>
                    <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8, type: "spring" }}
              className="absolute -top-2 -right-2 md:top-0 md:right-0 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xs md:text-sm font-semibold shadow-lg"
            >
              🚀 Crescendo rápido!
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PlatformOverviewSection;
