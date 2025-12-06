// Configuração de textos e temas por categoria principal
export interface CategoryTheme {
  id: string;
  name: string;
  icon: string;
  headerTitle: string;
  headerSubtitle: string;
  offersTitle: string;
  offersSubtitle: string;
  trendingTitle: string;
  trendingSubtitle: string;
  forYouTitle: string;
  forYouSubtitle: string;
  accentColor: string;
  bgGradient: string;
}

export const categoryThemes: Record<string, CategoryTheme> = {
  default: {
    id: "default",
    name: "Geral",
    icon: "🏠",
    headerTitle: "Tudo em um só lugar",
    headerSubtitle: "Encontre o que você precisa",
    offersTitle: "Ofertas Imperdíveis",
    offersSubtitle: "Produtos com desconto especial",
    trendingTitle: "Tendências do Dia",
    trendingSubtitle: "O que está fazendo sucesso",
    forYouTitle: "Só Pra Você",
    forYouSubtitle: "Recomendações personalizadas",
    accentColor: "text-primary",
    bgGradient: "from-primary/5 to-transparent",
  },
  mercado: {
    id: "mercado",
    name: "Mercado",
    icon: "🛒",
    headerTitle: "Seu Mercado Online",
    headerSubtitle: "Tudo para sua casa em um só lugar",
    offersTitle: "Promoções do Mercado",
    offersSubtitle: "Economize nas suas compras do dia",
    trendingTitle: "Mais Procurados",
    trendingSubtitle: "Produtos em alta no mercado",
    forYouTitle: "Sua Lista Inteligente",
    forYouSubtitle: "Baseado no que você costuma comprar",
    accentColor: "text-emerald-600",
    bgGradient: "from-emerald-50 to-transparent dark:from-emerald-950/20",
  },
  farmacia: {
    id: "farmacia",
    name: "Farmácia",
    icon: "💊",
    headerTitle: "Cuidando da Sua Saúde",
    headerSubtitle: "Medicamentos e bem-estar",
    offersTitle: "Ofertas em Saúde",
    offersSubtitle: "Descontos em medicamentos e vitaminas",
    trendingTitle: "Mais Vendidos",
    trendingSubtitle: "Produtos que cuidam de você",
    forYouTitle: "Cuide-se Bem",
    forYouSubtitle: "Sugestões para seu bem-estar",
    accentColor: "text-red-500",
    bgGradient: "from-red-50 to-transparent dark:from-red-950/20",
  },
  compras: {
    id: "compras",
    name: "Compras",
    icon: "🛍️",
    headerTitle: "Shopping Online",
    headerSubtitle: "Moda, eletrônicos e muito mais",
    offersTitle: "Mega Ofertas",
    offersSubtitle: "Os melhores preços da internet",
    trendingTitle: "Em Alta",
    trendingSubtitle: "O que todo mundo está comprando",
    forYouTitle: "Seu Estilo",
    forYouSubtitle: "Produtos que combinam com você",
    accentColor: "text-green-600",
    bgGradient: "from-green-50 to-transparent dark:from-green-950/20",
  },
  comida: {
    id: "comida",
    name: "Comida",
    icon: "🍔",
    headerTitle: "Saboreie Cada Mordida",
    headerSubtitle: "Restaurantes e delivery de comida",
    offersTitle: "Promoções Deliciosas",
    offersSubtitle: "Descontos para matar a fome",
    trendingTitle: "Sabores do Momento",
    trendingSubtitle: "O que está fazendo sucesso",
    forYouTitle: "Feito Pra Você",
    forYouSubtitle: "Baseado no seu paladar",
    accentColor: "text-amber-600",
    bgGradient: "from-amber-50 to-transparent dark:from-amber-950/20",
  },
  artesanato: {
    id: "artesanato",
    name: "Artesanato",
    icon: "🎨",
    headerTitle: "Arte do Nordeste",
    headerSubtitle: "Peças únicas feitas à mão",
    offersTitle: "Ofertas Artesanais",
    offersSubtitle: "Apoie o artesão local",
    trendingTitle: "Destaques Artesanais",
    trendingSubtitle: "Peças mais admiradas",
    forYouTitle: "Arte Pra Você",
    forYouSubtitle: "Peças que combinam com seu estilo",
    accentColor: "text-purple-600",
    bgGradient: "from-purple-50 to-transparent dark:from-purple-950/20",
  },
  servicos: {
    id: "servicos",
    name: "Serviços",
    icon: "🔧",
    headerTitle: "Serviços Locais",
    headerSubtitle: "Profissionais perto de você",
    offersTitle: "Serviços em Promoção",
    offersSubtitle: "Encontre o profissional ideal",
    trendingTitle: "Mais Contratados",
    trendingSubtitle: "Profissionais bem avaliados",
    forYouTitle: "Serviços Recomendados",
    forYouSubtitle: "Baseado nas suas necessidades",
    accentColor: "text-blue-600",
    bgGradient: "from-blue-50 to-transparent dark:from-blue-950/20",
  },
};

export const getCategoryTheme = (categoryId: string | null): CategoryTheme => {
  if (!categoryId) return categoryThemes.default;
  return categoryThemes[categoryId] || categoryThemes.default;
};
