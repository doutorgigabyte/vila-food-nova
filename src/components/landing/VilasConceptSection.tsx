import { motion } from "framer-motion";
import { MapPin, Store, CreditCard, ShoppingBag, Users, ArrowRight, Check, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const VilasConceptSection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            Novidade
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Vilas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Múltiplas lojas, um só pedido. Conecte seu estabelecimento a polos comerciais 
            e ofereça uma experiência única aos seus clientes.
          </p>
        </motion.div>

        {/* Main Content - Concept Illustration */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left - Visual Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Vila Illustration */}
            <div className="relative bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl p-8 border border-border/50">
              {/* Central Vila Hub */}
              <div className="flex flex-col items-center">
                {/* Vila Name */}
                <div className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-semibold mb-8 shadow-lg">
                  🏪 Vila das Artes
                </div>

                {/* Stores Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { name: "Pizzaria", emoji: "🍕", color: "bg-red-100 border-red-200" },
                    { name: "Hamburgueria", emoji: "🍔", color: "bg-amber-100 border-amber-200" },
                    { name: "Açaí", emoji: "🍇", color: "bg-purple-100 border-purple-200" },
                    { name: "Sushi", emoji: "🍣", color: "bg-orange-100 border-orange-200" },
                    { name: "Doceria", emoji: "🧁", color: "bg-pink-100 border-pink-200" },
                    { name: "Café", emoji: "☕", color: "bg-amber-50 border-amber-200" },
                  ].map((store, idx) => (
                    <motion.div
                      key={store.name}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className={`${store.color} border rounded-xl p-3 text-center shadow-sm`}
                    >
                      <span className="text-2xl block mb-1">{store.emoji}</span>
                      <span className="text-xs font-medium text-foreground/80">{store.name}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Flow Arrow */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center gap-3 text-muted-foreground mb-4"
                >
                  <div className="h-px w-8 bg-border" />
                  <ArrowRight className="w-5 h-5 text-primary animate-pulse" />
                  <div className="h-px w-8 bg-border" />
                </motion.div>

                {/* Single Order Result */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                  className="bg-card border border-border rounded-xl p-4 shadow-md w-full max-w-xs"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Pedido Único</p>
                      <p className="text-xs text-muted-foreground">3 lojas • 1 pagamento</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" />
                      Retirada única
                    </span>
                    <span className="text-primary font-medium">R$ 87,50</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right - Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-foreground mb-6">
              O que são Vilas?
            </h3>
            <p className="text-muted-foreground mb-8">
              Vilas são polos comerciais onde múltiplos estabelecimentos operam juntos — 
              galerias, food parks, praças de alimentação, mercados. Com o VilaFood, 
              seus clientes podem fazer <strong>um único pedido</strong> em várias lojas 
              da mesma vila.
            </p>

            {/* Benefits List */}
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-card rounded-xl border border-border/50">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Para o cliente</h4>
                  <p className="text-sm text-muted-foreground">
                    Pedido em várias lojas, pagamento único, retirada em um só lugar
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-card rounded-xl border border-border/50">
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center shrink-0">
                  <Store className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Para o lojista</h4>
                  <p className="text-sm text-muted-foreground">
                    Maior visibilidade, clientes compartilhados, gestão simplificada
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-card rounded-xl border border-border/50">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Split automático</h4>
                  <p className="text-sm text-muted-foreground">
                    O sistema divide o valor automaticamente para cada estabelecimento
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Payment Flow Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-6 md:p-8"
        >
          <h3 className="text-xl font-bold text-center mb-8">Como funciona o pagamento?</h3>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center max-w-[180px]">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <ShoppingBag className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm font-medium">Cliente faz pedido em 3 lojas</p>
              <p className="text-xs text-muted-foreground mt-1">R$ 100 total</p>
            </div>

            <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
            <div className="h-6 w-px bg-border md:hidden" />

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center max-w-[180px]">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <CreditCard className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-sm font-medium">Paga uma única vez</p>
              <p className="text-xs text-muted-foreground mt-1">PIX ou Cartão</p>
            </div>

            <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
            <div className="h-6 w-px bg-border md:hidden" />

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center max-w-[180px]">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-3">
                <Building2 className="w-7 h-7 text-accent-foreground" />
              </div>
              <p className="text-sm font-medium">Sistema divide automaticamente</p>
              <p className="text-xs text-muted-foreground mt-1">Cada loja recebe sua parte</p>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8 max-w-xl mx-auto">
            O valor é processado e distribuído automaticamente para cada estabelecimento 
            conforme o valor dos produtos pedidos, garantindo transparência e praticidade.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            Quer cadastrar seu estabelecimento em uma vila?
          </p>
          <Link to="/cadastro-estabelecimento">
            <Button size="lg" className="btn-yellow">
              <Store className="w-5 h-5 mr-2" />
              Cadastrar meu estabelecimento
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default VilasConceptSection;
