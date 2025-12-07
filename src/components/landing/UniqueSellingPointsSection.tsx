import { motion } from "framer-motion";
import { Video, MessageSquare, CreditCard, MapPin, LayoutDashboard, Sparkles } from "lucide-react";

const differentials = [
  {
    icon: Video,
    title: "VilaTok Stories",
    description: "Rede social integrada com stories e vídeos para engajar clientes. Crie conteúdo viral e aumente suas vendas.",
    gradient: "from-pink-500 to-rose-500",
    delay: 0,
  },
  {
    icon: MessageSquare,
    title: "WhatsApp + IA 24/7",
    description: "Bot inteligente que responde dúvidas, apresenta cardápio e fecha pedidos automaticamente, 24 horas por dia.",
    gradient: "from-green-500 to-emerald-500",
    delay: 0.1,
  },
  {
    icon: CreditCard,
    title: "Multi-Split Payment",
    description: "Pagamento único para múltiplas lojas na mesma vila. Clientes compram de várias lojas e pagam uma só vez.",
    gradient: "from-blue-500 to-cyan-500",
    delay: 0.2,
  },
  {
    icon: MapPin,
    title: "Marketplace Regional",
    description: "Presença no marketplace da sua cidade com geolocalização. Clientes encontram sua loja facilmente.",
    gradient: "from-orange-500 to-amber-500",
    delay: 0.3,
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Completo",
    description: "Gestão profissional com KDS para cozinha, PDV para vendas, controle de entregadores e relatórios detalhados.",
    gradient: "from-purple-500 to-violet-500",
    delay: 0.4,
  },
];

const UniqueSellingPointsSection = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden" id="diferenciais">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      <div className="absolute top-1/4 -left-64 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

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
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">O que nos torna únicos</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Diferenciais que{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Transformam
            </span>{" "}
            seu Negócio
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Funcionalidades exclusivas que você não encontra em nenhum outro lugar. 
            Tecnologia de ponta para impulsionar suas vendas.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {differentials.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: item.delay }}
              className={`group relative ${index === 4 ? 'md:col-span-2 lg:col-span-1' : ''}`}
            >
              {/* Glassmorphism Card */}
              <div className="relative h-full p-6 md:p-8 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
                {/* Gradient border effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Icon */}
                <div className={`relative z-10 inline-flex p-4 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg mb-6`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground">
            E muito mais recursos exclusivos esperando por você
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default UniqueSellingPointsSection;
