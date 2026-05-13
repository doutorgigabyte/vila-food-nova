import { Star, Quote } from "lucide-react";
import { useTestimonials, type Testimonial } from "@/hooks/useTestimonials";
import { useCustomerLogos } from "@/hooks/useCustomerLogos";
import mercadoPagoLogo from "@/assets/logos/mercado-pago.jpg";
import pagBankLogo from "@/assets/logos/pagbank.jpg";

type Partner = { name: string; logo?: string };

const partners: Partner[] = [
  { name: "Mercado Pago", logo: mercadoPagoLogo },
  { name: "PagBank", logo: pagBankLogo },
  { name: "WhatsApp" },
  { name: "Google" },
  { name: "GetNet" },
];

// Fallback usado quando a tabela `testimonials` estiver vazia (early stage).
// Marketing pode adicionar reais via /admin/depoimentos e estes somem.
const fallbackTestimonials: Pick<
  Testimonial,
  "id" | "name" | "role" | "content" | "rating" | "avatar_url" | "metric_label" | "metric_value"
>[] = [
  {
    id: "fallback-1",
    name: "Carlos Silva",
    role: "Dono - Pizzaria Don Carlo",
    content:
      "Triplicamos nossos pedidos em 3 meses. O WhatsApp com IA mudou completamente nosso atendimento. Recomendo demais!",
    rating: 5,
    avatar_url: null,
    metric_label: null,
    metric_value: null,
  },
  {
    id: "fallback-2",
    name: "Ana Beatriz",
    role: "Proprietária - Açaí da Ana",
    content:
      "Finalmente uma plataforma que entende o pequeno empreendedor. Preço justo, suporte incrível e muito fácil de usar.",
    rating: 5,
    avatar_url: null,
    metric_label: null,
    metric_value: null,
  },
  {
    id: "fallback-3",
    name: "Roberto Mendes",
    role: "Gerente - Burger House",
    content:
      "A gestão de pedidos é sensacional. Notificações em tempo real, relatórios detalhados. Exatamente o que precisávamos.",
    rating: 5,
    avatar_url: null,
    metric_label: null,
    metric_value: null,
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const TestimonialsSection = () => {
  const { data: dbTestimonials } = useTestimonials();
  const { data: customerLogos } = useCustomerLogos();
  const testimonials =
    dbTestimonials && dbTestimonials.length > 0 ? dbTestimonials : fallbackTestimonials;
  const isFallback = !dbTestimonials || dbTestimonials.length === 0;

  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent font-medium text-sm mb-4">
            Depoimentos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Quem usa, <span className="gradient-text">recomenda</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isFallback
              ? "Os primeiros estabelecimentos já estão crescendo com o VilaFood. Veja o que eles dizem."
              : "Histórias reais de quem migrou e parou de pagar comissões abusivas."}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.slice(0, 3).map((testimonial) => (
            <div
              key={testimonial.id}
              className="relative p-6 rounded-2xl bg-card border border-border hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
            >
              <Quote className="absolute top-6 right-6 text-primary/10" size={40} />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="text-primary fill-primary" />
                ))}
              </div>

              <p className="text-foreground mb-4 relative z-10">"{testimonial.content}"</p>

              {testimonial.metric_value && (
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                  <span className="text-sm font-bold text-green-700 dark:text-green-400">
                    {testimonial.metric_value}
                  </span>
                  {testimonial.metric_label && (
                    <span className="text-xs text-green-700/80 dark:text-green-400/80">
                      {testimonial.metric_label}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                {testimonial.avatar_url ? (
                  <img
                    src={testimonial.avatar_url}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {getInitials(testimonial.name)}
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                  {testimonial.role && (
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Customer logos (real, vindos do DB) — so renderiza se ha 3+ logos */}
        {customerLogos && customerLogos.length >= 3 && (
          <div className="mt-16 pt-12 border-t border-border">
            <p className="text-center text-sm text-muted-foreground mb-8">
              Estabelecimentos que ja usam o VilaFood
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
              {customerLogos.slice(0, 12).map((est) => (
                <a
                  key={est.id}
                  href={`/loja/${est.slug}`}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  title={est.name}
                >
                  <img
                    src={est.logo_url}
                    alt={`${est.name} logo`}
                    className="h-10 md:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Trust badges (parceiros tecnologicos) — sempre renderiza */}
        <div className="mt-16 pt-12 border-t border-border">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Parceiros e integrações
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 opacity-70">
            {partners.map((partner) => (
              <div key={partner.name} className="flex items-center justify-center h-8 md:h-10">
                {partner.logo ? (
                  <img
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    className="h-full w-auto object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-lg md:text-xl font-semibold text-muted-foreground">
                    {partner.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
