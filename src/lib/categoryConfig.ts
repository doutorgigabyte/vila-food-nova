export interface Subcategory {
  id: string;
  name: string;
  icon: string;
  segmentIds?: string[]; // IDs dos segmentos relacionados no banco
}

export interface CategoryConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  subcategories: Subcategory[];
}

export const categoryConfigs: Record<string, CategoryConfig> = {
  mercado: {
    id: "mercado",
    name: "Mercado",
    icon: "🛒",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    description: "Tudo para sua casa em um só lugar",
    subcategories: [
      { id: "temperos", name: "Temperos", icon: "🌶️" },
      { id: "cozinha", name: "Cozinha", icon: "🍳" },
      { id: "limpeza", name: "Limpeza", icon: "🧹" },
      { id: "hortifruti", name: "Hortifruti", icon: "🥬" },
      { id: "laticinios", name: "Laticínios", icon: "🥛" },
      { id: "carnes", name: "Carnes", icon: "🥩" },
      { id: "peixes", name: "Peixes e Frutos do Mar", icon: "🐟" },
      { id: "padaria", name: "Padaria", icon: "🥖" },
      { id: "bebidas", name: "Bebidas", icon: "🥤" },
      { id: "congelados", name: "Congelados", icon: "🧊" },
      { id: "despensa", name: "Despensa", icon: "🥫" },
      { id: "lanches", name: "Lanches", icon: "🍪" },
      { id: "saude", name: "Saúde", icon: "💊" },
      { id: "higiene", name: "Higiene", icon: "🧴" },
      { id: "bebe", name: "Bebê", icon: "👶" },
    ],
  },
  farmacia: {
    id: "farmacia",
    name: "Farmácia",
    icon: "💊",
    color: "text-red-600",
    bgColor: "bg-red-50",
    description: "Medicamentos e cuidados com a saúde",
    subcategories: [
      { id: "medicamentos", name: "Medicamentos", icon: "💊" },
      { id: "vitaminas", name: "Vitaminas", icon: "🌟" },
      { id: "suplementos", name: "Suplementos", icon: "💪" },
      { id: "primeiros-socorros", name: "Primeiros Socorros", icon: "🩹" },
      { id: "cuidados-bebe", name: "Cuidados Bebê", icon: "👶" },
      { id: "dispositivos", name: "Dispositivos", icon: "📱" },
      { id: "pele", name: "Cuidados Pele", icon: "🧴" },
      { id: "bucal", name: "Saúde Bucal", icon: "🦷" },
      { id: "feminina", name: "Saúde Feminina", icon: "💜" },
      { id: "olhos", name: "Cuidados Olhos", icon: "👁️" },
    ],
  },
  compras: {
    id: "compras",
    name: "Compras",
    icon: "🛍️",
    color: "text-green-600",
    bgColor: "bg-green-50",
    description: "Moda, eletrônicos e muito mais",
    subcategories: [
      { id: "moda-masculina", name: "Moda Masculina", icon: "👔" },
      { id: "moda-feminina", name: "Moda Feminina", icon: "👗" },
      { id: "moda-infantil", name: "Moda Infantil", icon: "👶" },
      { id: "beleza", name: "Beleza", icon: "💄" },
      { id: "pet", name: "Pet Shop", icon: "🐕" },
      { id: "casa-cozinha", name: "Casa & Cozinha", icon: "🍳" },
      { id: "esportes", name: "Esportes", icon: "⚽" },
      { id: "joias", name: "Jóias", icon: "💎" },
      { id: "presentes", name: "Presentes", icon: "🎁" },
      { id: "eletronicos", name: "Eletrônicos", icon: "📱" },
      { id: "relogios", name: "Relógios", icon: "⌚" },
      { id: "oculos", name: "Óculos", icon: "👓" },
    ],
  },
  comida: {
    id: "comida",
    name: "Comida",
    icon: "🍔",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    description: "Restaurantes e delivery de comida",
    subcategories: [
      { id: "pizza", name: "Pizza", icon: "🍕" },
      { id: "burger", name: "Hambúrguer", icon: "🍔" },
      { id: "churrasco", name: "Churrasco", icon: "🥩" },
      { id: "brasileira", name: "Comida Brasileira", icon: "🍛" },
      { id: "nordestina", name: "Nordestina", icon: "🦐" },
      { id: "japonesa", name: "Japonesa", icon: "🍣" },
      { id: "italiana", name: "Italiana", icon: "🍝" },
      { id: "mexicana", name: "Mexicana", icon: "🌮" },
      { id: "acai", name: "Açaí", icon: "🫐" },
      { id: "doces", name: "Doces & Sobremesas", icon: "🍰" },
      { id: "bebidas", name: "Bebidas", icon: "🥤" },
      { id: "saudavel", name: "Saudável", icon: "🥗" },
      { id: "lanches", name: "Lanches", icon: "🥪" },
    ],
  },
  artesanato: {
    id: "artesanato",
    name: "Artesanato",
    icon: "🎨",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    description: "Arte e cultura do Nordeste",
    subcategories: [
      { id: "ceramica", name: "Cerâmica", icon: "🏺" },
      { id: "bordados", name: "Bordados", icon: "🧵" },
      { id: "renda", name: "Renda", icon: "🪡" },
      { id: "palha", name: "Palha", icon: "🌾" },
      { id: "madeira", name: "Madeira", icon: "🪵" },
      { id: "pintura", name: "Pintura", icon: "🎨" },
      { id: "bijuterias", name: "Bijuterias", icon: "📿" },
      { id: "decoracao", name: "Decoração", icon: "🖼️" },
      { id: "textil", name: "Têxtil", icon: "🧶" },
      { id: "couro", name: "Couro", icon: "👜" },
      { id: "barro", name: "Barro", icon: "🪴" },
      { id: "croche", name: "Crochê", icon: "🧶" },
    ],
  },
  servicos: {
    id: "servicos",
    name: "Serviços",
    icon: "🔧",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "Profissionais e serviços locais",
    subcategories: [
      { id: "entrega", name: "Entregas", icon: "📦" },
      { id: "manutencao", name: "Manutenção", icon: "🔧" },
      { id: "limpeza-servico", name: "Limpeza", icon: "🧹" },
      { id: "eventos", name: "Eventos", icon: "🎉" },
      { id: "beleza-servico", name: "Beleza", icon: "💇" },
      { id: "saude-servico", name: "Saúde", icon: "❤️" },
      { id: "educacao", name: "Educação", icon: "📚" },
      { id: "tecnologia", name: "Tecnologia", icon: "💻" },
    ],
  },
};

export const getCategoryConfig = (categoryId: string): CategoryConfig | undefined => {
  return categoryConfigs[categoryId];
};

export const getAllCategories = (): CategoryConfig[] => {
  return Object.values(categoryConfigs);
};
