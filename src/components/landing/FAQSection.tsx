import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLandingAnalytics, useSectionView } from "@/hooks/useLandingAnalytics";
import { useFAQItems } from "@/hooks/useFAQItems";

const FAQSection = () => {
  const { trackFAQOpened, trackCTAClick } = useLandingAnalytics();
  const sectionRef = useSectionView("faq");
  const faqCategories = useFAQItems();

  return (
    <section ref={sectionRef} className="py-12 md:py-20 lg:py-32 relative overflow-hidden" id="faq">
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
                <Accordion
                  type="single"
                  collapsible
                  className="divide-y divide-border/30"
                  onValueChange={(value) => {
                    if (!value) return; // fechou: nao trackeia
                    const [, idxStr] = value.split("-");
                    const idx = Number(idxStr);
                    const question = category.questions[idx]?.question;
                    if (question) trackFAQOpened(question);
                  }}
                >
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
              href="https://wa.me/5581983655465"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
              onClick={() => trackCTAClick({
                ctaText: "Fale conosco pelo WhatsApp",
                ctaLocation: "faq_bottom",
                destination: "whatsapp",
              })}
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
