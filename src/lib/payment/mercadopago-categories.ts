/**
 * Mercado Pago Category Mapping
 * Mapeia categorias do sistema para IDs de categoria do Mercado Pago
 * Isso melhora a taxa de aprovação de pagamentos
 */

// Categorias oficiais do Mercado Pago
// https://api.mercadopago.com/item_categories
export const MP_CATEGORY_IDS = {
  // Alimentos e Bebidas
  food: 'food',
  drinks: 'drinks',
  fast_food: 'fast_food',
  pizza: 'pizza',
  sushi: 'sushi',
  bakery: 'bakery',
  sweets: 'sweets',
  ice_cream: 'ice_cream',
  coffee: 'coffee',
  restaurant: 'restaurant',
  
  // Genéricos
  others: 'others',
  services: 'services',
  
  // Delivery específico
  delivery: 'delivery',
  shipping: 'shipping',
} as const;

export type MPCategoryId = typeof MP_CATEGORY_IDS[keyof typeof MP_CATEGORY_IDS];

// Mapeamento de categorias do sistema para categorias do MP
const categoryMapping: Record<string, MPCategoryId> = {
  // Pizzarias
  'pizza': 'pizza',
  'pizzas': 'pizza',
  'pizzaria': 'pizza',
  
  // Japonês/Sushi
  'sushi': 'sushi',
  'japones': 'sushi',
  'japonesa': 'sushi',
  'temaki': 'sushi',
  
  // Lanches e Fast Food
  'lanche': 'fast_food',
  'lanches': 'fast_food',
  'hamburguer': 'fast_food',
  'hamburgueres': 'fast_food',
  'burger': 'fast_food',
  'hot dog': 'fast_food',
  'cachorro quente': 'fast_food',
  'fast food': 'fast_food',
  'sanduiche': 'fast_food',
  'sanduiches': 'fast_food',
  
  // Doces e Sobremesas
  'doce': 'sweets',
  'doces': 'sweets',
  'sobremesa': 'sweets',
  'sobremesas': 'sweets',
  'bolo': 'sweets',
  'bolos': 'sweets',
  'torta': 'sweets',
  'tortas': 'sweets',
  'brigadeiro': 'sweets',
  'chocolate': 'sweets',
  'confeitaria': 'sweets',
  
  // Sorvetes
  'sorvete': 'ice_cream',
  'sorvetes': 'ice_cream',
  'açaí': 'ice_cream',
  'acai': 'ice_cream',
  'gelato': 'ice_cream',
  
  // Padaria
  'padaria': 'bakery',
  'pao': 'bakery',
  'paes': 'bakery',
  'pães': 'bakery',
  
  // Bebidas
  'bebida': 'drinks',
  'bebidas': 'drinks',
  'suco': 'drinks',
  'sucos': 'drinks',
  'refrigerante': 'drinks',
  'agua': 'drinks',
  'água': 'drinks',
  'cerveja': 'drinks',
  'vinho': 'drinks',
  'drink': 'drinks',
  'drinks': 'drinks',
  'coquetel': 'drinks',
  
  // Café
  'cafe': 'coffee',
  'café': 'coffee',
  'cafeteria': 'coffee',
  'cappuccino': 'coffee',
  'expresso': 'coffee',
  
  // Comida geral
  'comida': 'food',
  'refeicao': 'food',
  'refeição': 'food',
  'prato': 'food',
  'pratos': 'food',
  'almoço': 'food',
  'almoco': 'food',
  'jantar': 'food',
  'cafe da manha': 'food',
  'café da manhã': 'food',
  
  // Restaurante
  'restaurante': 'restaurant',
  'self service': 'restaurant',
  'buffet': 'restaurant',
  
  // Delivery/Frete
  'entrega': 'delivery',
  'frete': 'delivery',
  'delivery': 'delivery',
  'taxa de entrega': 'shipping',
  
  // Outros/Default
  'outros': 'others',
  'outro': 'others',
  'combo': 'food',
  'promoção': 'food',
  'promocao': 'food',
};

/**
 * Obtém o category_id do Mercado Pago baseado no nome da categoria
 */
export function getMPCategoryId(categoryName?: string | null): MPCategoryId {
  if (!categoryName) return 'food';
  
  const normalizedName = categoryName.toLowerCase().trim();
  
  // Busca direta
  if (categoryMapping[normalizedName]) {
    return categoryMapping[normalizedName];
  }
  
  // Busca parcial - verifica se alguma chave está contida no nome
  for (const [key, value] of Object.entries(categoryMapping)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }
  
  // Default para food (comida)
  return 'food';
}

/**
 * Obtém o category_id baseado no tipo de segmento do estabelecimento
 */
export function getMPCategoryBySegment(segmentName?: string | null): MPCategoryId {
  if (!segmentName) return 'restaurant';
  
  const normalizedSegment = segmentName.toLowerCase().trim();
  
  if (normalizedSegment.includes('pizza')) return 'pizza';
  if (normalizedSegment.includes('japones') || normalizedSegment.includes('sushi')) return 'sushi';
  if (normalizedSegment.includes('lanche') || normalizedSegment.includes('burger') || normalizedSegment.includes('fast')) return 'fast_food';
  if (normalizedSegment.includes('doce') || normalizedSegment.includes('confeitaria')) return 'sweets';
  if (normalizedSegment.includes('sorvete') || normalizedSegment.includes('açaí') || normalizedSegment.includes('acai')) return 'ice_cream';
  if (normalizedSegment.includes('padaria')) return 'bakery';
  if (normalizedSegment.includes('bebida') || normalizedSegment.includes('bar')) return 'drinks';
  if (normalizedSegment.includes('cafe') || normalizedSegment.includes('café')) return 'coffee';
  
  return 'restaurant';
}
