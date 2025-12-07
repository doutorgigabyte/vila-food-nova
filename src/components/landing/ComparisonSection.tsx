import { motion } from "framer-motion";
import { Check, X, Trophy, Percent, Globe, Bot, Palette, CreditCard, TrendingUp } from "lucide-react";

const features = [
  { 
    name: "Taxa por pedido", 
    vilafood: "0%", 
    ifood: "12-27%", 
    rappi: "15-25%",
    icon: Percent,
    highlight: true
  },
  { 
    name: "Domínio próprio", 
    vilafood: true, 
    ifood: false, 
    rappi: false,
    icon: Globe,
    highlight: true
  },
  { 
    name: "WhatsApp com IA", 
    vilafood: true, 
    ifood: false, 
    rappi: false,
    icon: Bot,
    highlight: true
  },
  { 
    name: "Stories/VilaTok", 
    vilafood: true, 
    ifood: false, 
    rappi: false,
    icon: TrendingUp,
    highlight: true
  },
  { 
    name: "Personalização total", 
    vilafood: true, 
    ifood: false, 
    rappi: false,
    icon: Palette,
    highlight: false
  },
  { 
    name: "Controle do cliente", 
    vilafood: true, 
    ifood: false, 
    rappi: false,
    icon: CreditCard,
    highlight: false
  },
];

const ComparisonSection = () => {
  const renderValue = (value: boolean | string, isVilaFood: boolean = false) => {
    if (typeof value === "boolean") {
      return value ? (
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isVilaFood ? 'bg-green-500/20' : 'bg-green-500/10'}`}>
          <Check className={`h-5 w-5 ${isVilaFood ? 'text-green-400' : 'text-green-500'}`} />
        </div>
      ) : (
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10">
          <X className="h-5 w-5 text-red-400" />
        </div>
      );
    }
    return (
      <span className={`font-semibold ${isVilaFood ? 'text-green-400' : 'text-muted-foreground'}`}>
        {value}
      </span>
    );
  };

  return (
    <section className="py-20 md:py-32 relative overflow-hidden" id="comparativo">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Comparativo</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Por que escolher o{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              VilaFood
            </span>
            ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Compare e veja como somos diferentes das grandes plataformas. 
            Mais recursos, menos taxas, controle total.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 p-4 md:p-6 bg-muted/30 border-b border-border/50">
              <div className="text-sm font-medium text-muted-foreground">Recurso</div>
              <div className="text-center">
                <div className="inline-flex flex-col items-center">
                  <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    VilaFood
                  </span>
                  <span className="text-xs text-green-400">⭐ Recomendado</span>
                </div>
              </div>
              <div className="text-center">
                <span className="text-sm font-medium text-muted-foreground">iFood</span>
              </div>
              <div className="text-center">
                <span className="text-sm font-medium text-muted-foreground">Rappi</span>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border/30">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className={`grid grid-cols-4 gap-4 p-4 md:p-6 items-center hover:bg-muted/20 transition-colors ${feature.highlight ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex p-2 rounded-lg bg-muted/50">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{feature.name}</span>
                  </div>
                  <div className="text-center">{renderValue(feature.vilafood, true)}</div>
                  <div className="text-center">{renderValue(feature.ifood)}</div>
                  <div className="text-center">{renderValue(feature.rappi)}</div>
                </motion.div>
              ))}
            </div>

            {/* Table Footer */}
            <div className="p-4 md:p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-t border-border/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground text-center sm:text-left">
                  💡 Com o VilaFood você tem <strong className="text-foreground">controle total</strong> do seu negócio
                </p>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                  <Check className="h-4 w-4" />
                  Sem taxas abusivas
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground">
            Chega de pagar taxas altas. <span className="text-primary font-semibold">Comece grátis hoje!</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
