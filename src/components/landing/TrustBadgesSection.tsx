import { motion } from "framer-motion";
import { Shield, CreditCard, MessageCircle, MapPin, Lock, Award } from "lucide-react";

const partners = [
  { name: "Mercado Pago", icon: CreditCard },
  { name: "WhatsApp Business", icon: MessageCircle },
  { name: "Google Maps", icon: MapPin },
];

const badges = [
  { icon: Shield, label: "Dados Protegidos", description: "LGPD Compliant" },
  { icon: Lock, label: "Pagamento Seguro", description: "Criptografia SSL" },
  { icon: Award, label: "Suporte Premium", description: "Atendimento 24/7" },
];

const TrustBadgesSection = () => {
  return (
    <section className="py-8 md:py-12 lg:py-16 relative overflow-hidden border-y border-border/30">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-muted/30 via-background to-muted/30" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col gap-6 md:gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Partners */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 md:gap-6"
          >
            <span className="text-xs md:text-sm text-muted-foreground font-medium">Parceiros:</span>
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
              {partners.map((partner, index) => (
                <motion.div
                  key={partner.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <partner.icon className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                  <span className="text-xs md:text-sm font-medium text-foreground">{partner.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-12 bg-border/50" />

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center lg:justify-end gap-4 md:gap-6"
          >
            {badges.map((badge, index) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-2 md:gap-3"
              >
                <div className="p-1.5 md:p-2 rounded-lg bg-green-500/10">
                  <badge.icon className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                </div>
                <div className="text-left">
                  <p className="text-xs md:text-sm font-medium text-foreground">{badge.label}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{badge.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TrustBadgesSection;
