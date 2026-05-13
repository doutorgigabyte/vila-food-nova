// Dados do FAQ extraidos de FAQSection para que possam ser usados
// no JSON-LD (FAQPage schema) em Conheca.tsx sem quebrar o lazy loading
// do componente FAQSection. Quando este conteudo migrar para o Supabase
// (Fase 3 do plano), este arquivo vira um wrapper sobre o hook.

export interface FAQQuestion {
  question: string;
  answer: string;
}

export interface FAQCategory {
  title: string;
  questions: FAQQuestion[];
}

export const faqCategories: FAQCategory[] = [
  {
    title: "Sobre a Plataforma",
    questions: [
      {
        question: "Como funciona o período gratuito?",
        answer: "Você pode começar usando o VilaFood gratuitamente com o Plano Grátis, que inclui até 50 produtos e funcionalidades básicas. Não é necessário cartão de crédito para começar. Quando seu negócio crescer, você pode fazer upgrade para planos com mais recursos.",
      },
      {
        question: "Preciso ter CNPJ para usar?",
        answer: "Não! Você pode começar como pessoa física (CPF). Trabalhamos com MEI, ME e empresas de todos os portes. O importante é ter um negócio legítimo e vontade de crescer.",
      },
      {
        question: "Posso usar meu próprio domínio?",
        answer: "Sim! Nos planos pagos você pode conectar seu próprio domínio (ex: www.minhaloja.com.br) ou usar nosso subdomínio gratuito (minhaloja.vilafood.delivery).",
      },
      {
        question: "Como é feita a migração de outra plataforma?",
        answer: "Nossa equipe oferece suporte completo para migração. Importamos seus produtos, categorias e configurações de outras plataformas. O processo é simples e você não perde nenhum dado.",
      },
    ],
  },
  {
    title: "Pagamentos",
    questions: [
      {
        question: "Quais formas de pagamento são aceitas?",
        answer: "Aceitamos PIX (pagamento instantâneo), cartões de crédito e débito via Mercado Pago, dinheiro na entrega e vale-refeição. Você escolhe quais métodos quer oferecer aos seus clientes.",
      },
      {
        question: "Quando recebo o dinheiro das vendas?",
        answer: "Para pagamentos via PIX, o dinheiro cai na sua conta do Mercado Pago instantaneamente. Para cartões, o prazo é de 14 a 30 dias conforme a política do Mercado Pago. Você tem total controle via dashboard.",
      },
      {
        question: "Vocês cobram taxa por pedido?",
        answer: "Diferente do iFood e Rappi, o VilaFood NÃO cobra taxa por pedido. Você paga apenas uma mensalidade fixa (ou usa o plano gratuito). As únicas taxas são as do gateway de pagamento (Mercado Pago), que são padrão do mercado.",
      },
    ],
  },
  {
    title: "Funcionalidades",
    questions: [
      {
        question: "O WhatsApp com IA é realmente automático?",
        answer: "Sim! Nosso bot com inteligência artificial responde automaticamente 24/7. Ele apresenta o cardápio, tira dúvidas sobre produtos, adiciona itens ao carrinho e até finaliza pedidos. Você só intervém quando quiser.",
      },
      {
        question: "Posso personalizar minha loja?",
        answer: "Completamente! Você pode escolher cores, adicionar logo, banner, descrição, horários de funcionamento e muito mais. Sua loja digital terá a cara do seu negócio.",
      },
      {
        question: "Como funciona o VilaTok Stories?",
        answer: "VilaTok é nossa rede social integrada. Você cria vídeos curtos mostrando seus produtos, promoções ou bastidores. Os clientes podem curtir, comentar e comprar diretamente dos vídeos. É como TikTok para negócios locais!",
      },
      {
        question: "Posso ter múltiplos funcionários na plataforma?",
        answer: "Sim! Dependendo do seu plano, você pode adicionar funcionários com diferentes níveis de acesso: Gerente (acesso total), Caixa (apenas PDV), Atendente (apenas pedidos), Garçom (mesa) e Entregador.",
      },
    ],
  },
  {
    title: "Suporte",
    questions: [
      {
        question: "Vocês oferecem treinamento?",
        answer: "Sim! Oferecemos tutoriais em vídeo, documentação completa e suporte via WhatsApp. Para planos empresariais, temos onboarding personalizado com nossa equipe.",
      },
      {
        question: "Como falo com o suporte?",
        answer: "Nosso suporte funciona via WhatsApp e chat na plataforma. Para clientes de planos pagos, oferecemos atendimento prioritário. Respondemos em até 24 horas úteis.",
      },
      {
        question: "Posso cancelar a qualquer momento?",
        answer: "Absolutamente! Não temos fidelidade ou multa de cancelamento. Se não estiver satisfeito, pode cancelar quando quiser. Seus dados ficam disponíveis por 30 dias após o cancelamento.",
      },
    ],
  },
];
