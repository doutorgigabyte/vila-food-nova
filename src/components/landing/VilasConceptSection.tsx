import { motion } from "framer-motion";
import { MapPin, Store, CreditCard, ShoppingBag, Users, ArrowRight, Check, Building2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const STORES_DATA = [
  { 
    name: "Pizzaria Bella", 
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop",
    product: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=100&h=100&fit=crop",
    price: "R$ 45,90"
  },
  { 
    name: "Burger House", 
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop",
    product: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=100&h=100&fit=crop",
    price: "R$ 32,00"
  },
  { 
    name: "Açaí da Ilha", 
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=200&h=200&fit=crop",
    product: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=100&h=100&fit=crop",
    price: "R$ 28,00"
  },
  { 
    name: "Sushi Express", 
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop",
    product: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=100&h=100&fit=crop",
    price: "R$ 65,00"
  },
  { 
    name: "Doce Sabor", 
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&h=200&fit=crop",
    product: "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=100&h=100&fit=crop",
    price: "R$ 18,00"
  },
  { 
    name: "Café Aroma", 
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop",
    product: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop",
    price: "R$ 12,00"
  },
];

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
          {/* Left - Visual Illustration with Real Photos */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Vila Illustration */}
            <div className="relative bg-gradient-to-br from-card to-muted/50 rounded-3xl p-6 md:p-8 border border-border/50 shadow-xl">
              {/* Central Vila Hub */}
              <div className="flex flex-col items-center">
                {/* Vila Name */}
                <div className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold mb-6 shadow-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Vila das Artes
                </div>

                {/* Stores Grid with Real Photos */}
                <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 w-full max-w-sm">
                  {STORES_DATA.map((store, idx) => (
                    <motion.div
                      key={store.name}
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative bg-card rounded-xl overflow-hidden shadow-md border border-border/50 hover:shadow-lg transition-all hover:scale-105"
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={store.image}
                          alt={store.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-1 left-1 right-1">
                          <p className="text-white text-[9px] md:text-[10px] font-medium truncate text-center">
                            {store.name}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Selected Products Flow */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="w-full max-w-sm"
                >
                  {/* Products being added */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <p className="text-xs text-muted-foreground">Produtos selecionados:</p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {STORES_DATA.slice(0, 3).map((store, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.7 + idx * 0.15 }}
                        className="relative"
                      >
                        <img
                          src={store.product}
                          alt="Produto"
                          className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover border-2 border-card shadow-md"
                        />
                        {idx < 2 && (
                          <Plus className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-primary bg-card rounded-full" />
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center mb-4">
                    <motion.div
                      animate={{ y: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <ArrowRight className="w-6 h-6 text-primary rotate-90" />
                    </motion.div>
                  </div>

                  {/* Single Order Result - Checkout Style */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.2 }}
                    className="bg-card border border-border rounded-xl p-4 shadow-md"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <ShoppingBag className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Pedidos separados</p>
                        <p className="text-xs text-muted-foreground">3 lojas • Retirada na vila</p>
                      </div>
                    </div>
                    
                    {/* Breakdown estilo iFood */}
                    <div className="space-y-2 text-sm border-t border-border pt-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>R$ 105,90</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxa de entrega</span>
                        <span className="text-green-600">Grátis</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t border-border">
                        <span>Total</span>
                        <span className="text-primary text-lg">R$ 105,90</span>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      {STORES_DATA.slice(0, 3).map((store, idx) => (
                        <img
                          key={idx}
                          src={store.product}
                          alt="Produto"
                          className="w-8 h-8 rounded-md object-cover border border-border"
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-auto">Pague cada loja</span>
                    </div>
                  </motion.div>
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
              seus clientes podem explorar várias lojas, <strong>pagar diretamente cada estabelecimento</strong> e 
              retirar os produtos na vila.
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
                    Explora várias lojas, paga cada uma separadamente e retira tudo na vila
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
                    Maior visibilidade, clientes compartilhados, 0% de taxa da plataforma
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-card rounded-xl border border-border/50">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">100% do valor pra você</h4>
                  <p className="text-sm text-muted-foreground">
                    Cliente paga direto para sua loja, sem intermediários
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
          <h3 className="text-xl font-bold text-center mb-8">Como funciona?</h3>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center max-w-[180px]">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <ShoppingBag className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm font-medium">Cliente explora a vila</p>
              <p className="text-xs text-muted-foreground mt-1">Várias lojas em um lugar</p>
            </div>

            <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
            <div className="h-6 w-px bg-border md:hidden" />

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center max-w-[180px]">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <CreditCard className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-sm font-medium">Paga cada loja</p>
              <p className="text-xs text-muted-foreground mt-1">Direto para o estabelecimento</p>
            </div>

            <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
            <div className="h-6 w-px bg-border md:hidden" />

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center max-w-[180px]">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-3">
                <Building2 className="w-7 h-7 text-accent-foreground" />
              </div>
              <p className="text-sm font-medium">Retira na vila</p>
              <p className="text-xs text-muted-foreground mt-1">Prático e conveniente</p>
            </div>
          </div>

          {/* Fee explanation cards */}
          <div className="grid md:grid-cols-1 gap-4 mt-8 max-w-md mx-auto">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Store className="w-4 h-4 text-green-600" />
                0% de taxa para o lojista
              </p>
              <p className="text-xs text-muted-foreground">
                O cliente paga diretamente para cada loja. <strong>100% do valor fica com você</strong> — 
                sem intermediários, sem comissões.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6 max-w-xl mx-auto">
            O VilaFood conecta clientes às lojas da vila de forma simples e transparente, 
            sem cobrar taxas sobre as vendas.
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
