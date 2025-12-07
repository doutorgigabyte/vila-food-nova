import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqCategories = [
  {
    title: "Sobre a Plataforma",
    questions: [
      {
        question: "Como funciona o período gratuito?",
        answer: "Você pode começar usando o VilaFood gratuitamente com o Plano Grátis, que inclui até 50 produtos e funcionalidades básicas. Não é necessário cartão de crédito para começar. Quando seu negócio crescer, você pode fazer upgrade para planos com mais recursos."
      },
      {
        question: "Preciso ter CNPJ para usar?",
        answer: "Não! Você pode começar como pessoa física (CPF). Trabalhamos com MEI, ME e empresas de todos os portes. O importante é ter um negócio legítimo e vontade de crescer."
      },
      {
        question: "Posso usar meu próprio domínio?",
        answer: "Sim! Nos planos pagos você pode conectar seu próprio domínio (ex: www.minhaloja.com.br) ou usar nosso subdomínio gratuito (minhaloja.vilafood.com.br)."
      },
      {
        question: "Como é feita a migração de outra plataforma?",
        answer: "Nossa equipe oferece suporte completo para migração. Importamos seus produtos, categorias e configurações de outras plataformas. O processo é simples e você não perde nenhum dado."
      },
    ]
  },
  {
    title: "Pagamentos",
    questions: [
      {
        question: "Quais formas de pagamento são aceitas?",
        answer: "Aceitamos PIX (pagamento instantâneo), cartões de crédito e débito via Mercado Pago, dinheiro na entrega e vale-refeição. Você escolhe quais métodos quer oferecer aos seus clientes."
      },
      {
        question: "Quando recebo o dinheiro das vendas?",
        answer: "Para pagamentos via PIX, o dinheiro cai na sua conta do Mercado Pago instantaneamente. Para cartões, o prazo é de 14 a 30 dias conforme a política do Mercado Pago. Você tem total controle via dashboard."
      },
      {
        question: "Vocês cobram taxa por pedido?",
        answer: "Diferente do iFood e Rappi, o VilaFood NÃO cobra taxa por pedido. Você paga apenas uma mensalidade fixa (ou usa o plano gratuito). As únicas taxas são as do gateway de pagamento (Mercado Pago), que são padrão do mercado."
      },
    ]
  },
  {
    title: "Funcionalidades",
    questions: [
      {
        question: "O WhatsApp com IA é realmente automático?",
        answer: "Sim! Nosso bot com inteligência artificial responde automaticamente 24/7. Ele apresenta o cardápio, tira dúvidas sobre produtos, adiciona itens ao carrinho e até finaliza pedidos. Você só intervém quando quiser."
      },
      {
        question: "Posso personalizar minha loja?",
        answer: "Completamente! Você pode escolher cores, adicionar logo, banner, descrição, horários de funcionamento e muito mais. Sua loja digital terá a cara do seu negócio."
      },
      {
        question: "Como funciona o VilaTok Stories?",
        answer: "VilaTok é nossa rede social integrada. Você cria vídeos curtos mostrando seus produtos, promoções ou bastidores. Os clientes podem curtir, comentar e comprar diretamente dos vídeos. É como TikTok para negócios locais!"
      },
      {
        question: "Posso ter múltiplos funcionários na plataforma?",
        answer: "Sim! Dependendo do seu plano, você pode adicionar funcionários com diferentes níveis de acesso: Gerente (acesso total), Caixa (apenas PDV), Atendente (apenas pedidos), Garçom (mesa) e Entregador."
      },
    ]
  },
  {
    title: "Suporte",
    questions: [
      {
        question: "Vocês oferecem treinamento?",
        answer: "Sim! Oferecemos tutoriais em vídeo, documentação completa e suporte via WhatsApp. Para planos empresariais, temos onboarding personalizado com nossa equipe."
      },
      {
        question: "Como falo com o suporte?",
        answer: "Nosso suporte funciona via WhatsApp e chat na plataforma. Para clientes de planos pagos, oferecemos atendimento prioritário. Respondemos em até 24 horas úteis."
      },
      {
        question: "Posso cancelar a qualquer momento?",
        answer: "Absolutamente! Não temos fidelidade ou multa de cancelamento. Se não estiver satisfeito, pode cancelar quando quiser. Seus dados ficam disponíveis por 30 dias após o cancelamento."
      },
    ]
  },
];

const FAQSection = () => {
  return (
    <section className="py-12 md:py-20 lg:py-32 relative overflow-hidden" id="faq">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 md:mb-6">
            <HelpCircle className="h-3 w-3 md:h-4 md:w-4 text-primary" />
            <span className="text-xs md:text-sm font-medium text-primary">Perguntas Frequentes</span>
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
            Tire suas{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dúvidas
            </span>
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Reunimos as perguntas mais comuns para ajudar você a entender 
            como o VilaFood pode transformar seu negócio.
          </p>
        </motion.div>

        {/* FAQ Categories */}
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            >
              {/* Category Title */}
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                {category.title}
              </h3>

              {/* Accordion */}
              <div className="rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 overflow-hidden">
                <Accordion type="single" collapsible className="divide-y divide-border/30">
                  {category.questions.map((item, index) => (
                    <AccordionItem key={index} value={`${category.title}-${index}`} className="border-none">
                      <AccordionTrigger className="px-4 md:px-6 py-3 md:py-4 hover:bg-muted/30 transition-colors text-left [&[data-state=open]]:bg-muted/20">
                        <span className="text-sm md:text-base text-foreground font-medium pr-4">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 md:px-6 pb-3 md:pb-4 text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 md:mt-12 text-center"
        >
          <p className="text-sm md:text-base text-muted-foreground">
            Ainda tem dúvidas?{" "}
            <a 
              href="https://wa.me/5581999999999" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              Fale conosco pelo WhatsApp
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
