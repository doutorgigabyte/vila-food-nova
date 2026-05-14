import type { StoreProduct } from "@/hooks/useStoreData";

interface EstablishmentSeed {
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  operating_hours?: any;
}

const dayMap: Record<string, string> = {
  sunday: "Su",
  monday: "Mo",
  tuesday: "Tu",
  wednesday: "We",
  thursday: "Th",
  friday: "Fr",
  saturday: "Sa",
};

/**
 * Converte operating_hours do schema VilaFood (object por dia da semana
 * com {open, start, end}) em strings ISO de OpeningHoursSpecification do
 * schema.org/Restaurant.
 */
const toOpeningHours = (operating_hours: any): string[] => {
  if (!operating_hours || typeof operating_hours !== "object") return [];
  const result: string[] = [];
  for (const [day, val] of Object.entries(operating_hours)) {
    if (!val || typeof val !== "object") continue;
    const v = val as { open?: boolean; start?: string; end?: string };
    if (!v.open || !v.start || !v.end) continue;
    const code = dayMap[day];
    if (!code) continue;
    result.push(`${code} ${v.start}-${v.end}`);
  }
  return result;
};

/**
 * Monta JSON-LD para a pagina de loja:
 *  - Restaurant (dados do estabelecimento, horarios, contato, geo)
 *  - ItemList com MenuItems (top N produtos pra SEO long-tail)
 *
 * Retorna um array de objetos JSON pra injetar via <script type="application/ld+json">.
 *
 * Por que: Google usa structured data pra mostrar carousel de produtos no
 * resultado de busca, e Restaurant aparece em Maps. Sem isso, paginas
 * /loja/:slug perdem CTR significativo em "pao de queijo + bairro".
 */
export const buildStoreJsonLd = (
  est: EstablishmentSeed,
  products: StoreProduct[],
  options: { baseUrl?: string; menuItemLimit?: number } = {}
): unknown[] => {
  const baseUrl = options.baseUrl || "https://vilafood.delivery";
  const limit = options.menuItemLimit ?? 30;
  const url = `${baseUrl}/loja/${est.slug}`;
  const image = est.banner_url || est.logo_url || `${baseUrl}/og-image.png`;

  // Restaurant
  const restaurant: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${url}#restaurant`,
    name: est.name,
    url,
    image,
    description: est.description || `Cardapio digital de ${est.name}.`,
    telephone: est.phone || est.whatsapp || undefined,
    servesCuisine: "Brasileira",
    priceRange: "$$",
  };

  if (est.address) {
    restaurant.address = {
      "@type": "PostalAddress",
      streetAddress: est.address,
      addressCountry: "BR",
    };
  }

  if (typeof est.latitude === "number" && typeof est.longitude === "number") {
    restaurant.geo = {
      "@type": "GeoCoordinates",
      latitude: est.latitude,
      longitude: est.longitude,
    };
  }

  const openingHours = toOpeningHours(est.operating_hours);
  if (openingHours.length) {
    restaurant.openingHours = openingHours;
  }

  // ItemList de MenuItems
  const validProducts = (products || []).filter(
    (p) => p && p.id && p.name && typeof p.price === "number"
  );

  const menuItems = validProducts.slice(0, limit).map((p, idx) => {
    const price = p.promotional_price && p.promotional_price > 0 ? p.promotional_price : p.price;
    const item: Record<string, unknown> = {
      "@type": "MenuItem",
      "@id": `${url}#menu-item-${p.id}`,
      name: p.name,
      url: `${url}#produto-${p.id}`,
      offers: {
        "@type": "Offer",
        price: price.toFixed(2),
        priceCurrency: "BRL",
        availability: "https://schema.org/InStock",
        url,
      },
    };
    if (p.description) item.description = p.description;
    if (p.image_url) item.image = p.image_url;
    return {
      "@type": "ListItem",
      position: idx + 1,
      item,
    };
  });

  const itemList = menuItems.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": `${url}#menu`,
        name: `Cardapio - ${est.name}`,
        itemListElement: menuItems,
        numberOfItems: menuItems.length,
      }
    : null;

  return itemList ? [restaurant, itemList] : [restaurant];
};
