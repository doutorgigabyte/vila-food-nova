import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Pizza,
  Beef,
  ShoppingCart,
  Pill,
  Palette,
  Utensils,
  Store,
  ArrowRight,
} from "lucide-react";
import { useLandingAnalytics, useSectionView } from "@/hooks/useLandingAnalytics";

interface UseCase {
  slug: string;
  icon: typeof Pizza;
  emoji: string;
  title: string;
  description: string;
  features: string[];
  gradient: string;
}

const useCases: UseCase[] = [
  {
    slug: "pizzaria",
    icon: Pizza,
    emoji: "🍕",
    title: "Pizzaria",
    description:
      "Cardápio digital completo com sabores metade/metade, bordas recheadas e combos personalizados.",
    features: ["Sabores metade/metade", "Bordas recheadas", "Combos promocionais"],
    gradient: "from-red-500 to-orange-500",
  },
  {
    slug: "hamburgueria",
    icon: Beef,
    emoji: "🍔",
    title: "Hamburgueria",
    description:
      "Monte seu hambúrguer com adicionais ilimitados, pontos de carne e combos irresistíveis.",
    features: ["Adicionais ilimitados", "Ponto da carne", "Combos completos"],
    gradient: "from-amber-500 to-yellow-500",
  },
  {
    slug: "mercado",
    icon: ShoppingCart,
    emoji: "🏪",
    title: "Mercado",
    description:
      "Catálogo completo com milhares de produtos, organizado por categorias e com busca inteligente.",
    features: ["Catálogo completo", "Delivery por bairro", "Busca inteligente"],
    gradient: "from-green-500 to-emerald-500",
  },
  {
    slug: "farmacia",
    icon: Pill,
    emoji: "💊",
    title: "Farmácia",
    description:
      "Medicamentos com busca por princípio ativo, envio de receita digital e entrega expressa.",
    features: ["Busca por produto", "Receita digital", "Entrega expressa"],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    slug: "artesanato",
    icon: Palette,
    emoji: "🎨",
    title: "Artesanato",
    description:
      "Vitrine digital gratuita por 1 ano para artesãos. Mostre seu trabalho e venda online.",
    features: ["1 ano grátis", "Vitrine regional", "Sem taxas"],
    gradient: "from-purple-500 to-pink-500",
  },
  {
    slug: "restaurante",
    icon: Utensils,
    emoji: "🍽️",
    title: "Restaurante",
    description:
      "Cardápio completo com pratos do dia, combos executivos e pedidos para mesa ou delivery.",
    features: ["Pratos do dia", "Combos executivos", "Mesa ou delivery"],
    gradient: "from-rose-500 to-red-500",
  },
];

const UseCasesSection = () => {
  const { trackCTAClick, trackSignupIntent } = useLandingAnalytics();
  const sectionRef = useSectionView("use_cases");

  return (
    <section ref={sectionRef} id="segmentos" className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Store className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">Casos de Uso</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Perfeito para{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              qualquer negócio
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Não importa o seu segmento — temos funcionalidades específicas para fazer seu negócio
            crescer.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group"
            >
              <div className="relative h-full p-6 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden flex flex-col">
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${useCase.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}
                />

                <div className="relative flex items-center gap-4 mb-4">
                  <span className="text-4xl" aria-hidden>
                    {useCase.emoji}
                  </span>
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${useCase.gradient} opacity-80`}>
                    <useCase.icon className="h-5 w-5 text-white" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {useCase.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {useCase.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {useCase.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-muted/50 text-muted-foreground border border-border/50"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <Link
                  to={`/cadastro-estabelecimento?segmento=${useCase.slug}`}
                  onClick={() => {
                    trackCTAClick({
                      ctaText: `Criar minha ${useCase.title.toLowerCase()}`,
                      ctaLocation: `use_case_${useCase.slug}`,
                      destination: '/cadastro-estabelecimento',
                    });
                    trackSignupIntent(`use_case_${useCase.slug}`);
                  }}
                  className="mt-auto inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 group/cta"
                >
                  Criar minha {useCase.title.toLowerCase()}
                  <ArrowRight className="h-4 w-4 group-hover/cta:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground">
            Não encontrou seu segmento?{" "}
            <a
              href="https://wa.me/5581983655465"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
              onClick={() =>
                trackCTAClick({
                  ctaText: 'Fale conosco (segmento custom)',
                  ctaLocation: 'use_cases_bottom',
                  destination: 'whatsapp',
                })
              }
            >
              Fale conosco no WhatsApp
            </a>{" "}
            — adaptamos para você.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default UseCasesSection;
