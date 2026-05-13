import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Store, ShoppingCart, TrendingUp, Sparkles } from "lucide-react";
import { useLandingStats } from "@/hooks/useLandingStats";
import { useSectionView } from "@/hooks/useLandingAnalytics";

const AVG_ORDER_VALUE = 45;
const IFOOD_AVG_FEE_PERCENT = 0.18;

/**
 * Conta de 0 ate `target` em ms milissegundos.
 * Usa requestAnimationFrame pra suavidade.
 */
function useAnimatedNumber(target: number, durationMs = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / durationMs, 1);
      // ease-out cubica
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

const LiveStatsSection = () => {
  const { data: stats } = useLandingStats();
  const sectionRef = useSectionView("live_stats");

  const establishments = stats?.activeEstablishments ?? 0;
  const orders = stats?.ordersLast30Days ?? 0;
  const estimatedSavings = Math.round(orders * AVG_ORDER_VALUE * IFOOD_AVG_FEE_PERCENT);

  const animEstablishments = useAnimatedNumber(establishments);
  const animOrders = useAnimatedNumber(orders);
  const animSavings = useAnimatedNumber(estimatedSavings);

  // Em early stage (ou sem dados), mostra copy honesto ao inves de
  // numeros pequenos que perderiam credibilidade ("1 estabelecimento").
  const showEarlyStageCopy = !stats || stats.isEarlyStage;

  return (
    <section
      ref={sectionRef}
      className="py-12 md:py-16 relative overflow-hidden border-y border-border/30"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-background to-accent/5" />

      <div className="container mx-auto px-4 relative z-10">
        {showEarlyStageCopy ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-4">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Plataforma em crescimento</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Os primeiros estabelecimentos já estão vendendo
            </h2>
            <p className="text-base text-muted-foreground">
              Estamos no início — cada loja que entra ajuda a moldar a plataforma. Seja um dos primeiros do seu bairro.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wider">
              VilaFood em números
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              <StatCard
                icon={Store}
                value={animEstablishments.toLocaleString("pt-BR")}
                label="Estabelecimentos ativos"
                color="text-primary"
              />
              <StatCard
                icon={ShoppingCart}
                value={animOrders.toLocaleString("pt-BR")}
                label="Pedidos nos últimos 30 dias"
                color="text-accent"
              />
              <StatCard
                icon={TrendingUp}
                value={`R$ ${animSavings.toLocaleString("pt-BR")}`}
                label="Economia estimada vs marketplaces*"
                color="text-green-600"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">
              *Comparado a comissão média de 18% do iFood sobre o ticket médio de R${AVG_ORDER_VALUE}.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

interface StatCardProps {
  icon: typeof Store;
  value: string;
  label: string;
  color: string;
}

const StatCard = ({ icon: Icon, value, label, color }: StatCardProps) => (
  <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
    <div className={`p-3 rounded-xl bg-muted/50 mb-3 ${color}`}>
      <Icon className="h-6 w-6 md:h-7 md:w-7" />
    </div>
    <div className={`text-3xl md:text-4xl font-bold ${color} mb-2`}>{value}</div>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export default LiveStatsSection;
