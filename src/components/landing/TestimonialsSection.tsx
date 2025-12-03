import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Dono - Pizzaria Don Carlo",
    content: "Triplicamos nossos pedidos em 3 meses. O WhatsApp com IA mudou completamente nosso atendimento. Recomendo demais!",
    rating: 5,
    avatar: "CS",
  },
  {
    name: "Ana Beatriz",
    role: "Proprietária - Açaí da Ana",
    content: "Finalmente uma plataforma que entende o pequeno empreendedor. Preço justo, suporte incrível e muito fácil de usar.",
    rating: 5,
    avatar: "AB",
  },
  {
    name: "Roberto Mendes",
    role: "Gerente - Burger House",
    content: "A gestão de pedidos é sensacional. Notificações em tempo real, relatórios detalhados. Exatamente o que precisávamos.",
    rating: 5,
    avatar: "RM",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent font-medium text-sm mb-4">
            Depoimentos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Quem usa,{" "}
            <span className="gradient-text">recomenda</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mais de 2.500 estabelecimentos confiam no VilaFood para impulsionar suas vendas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="relative p-6 rounded-2xl bg-card border border-border hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
            >
              <Quote className="absolute top-6 right-6 text-primary/10" size={40} />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="text-primary fill-primary" />
                ))}
              </div>

              <p className="text-foreground mb-6 relative z-10">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 pt-12 border-t border-border">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Parceiros e integrações
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            {["Mercado Pago", "PagSeguro", "WhatsApp", "Google", "GetNet"].map((partner) => (
              <div
                key={partner}
                className="text-lg md:text-xl font-semibold text-muted-foreground"
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
