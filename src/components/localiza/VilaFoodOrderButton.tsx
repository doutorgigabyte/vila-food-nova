import { Button } from "@/components/ui/button";
import { ShoppingBag, ExternalLink } from "lucide-react";

interface VilaFoodOrderButtonProps {
  establishmentSlug: string;
  productId?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  label?: string;
}

const VILAFOOD_BASE_URL = "https://vilafood.com";

function buildOrderUrl(slug: string, productId?: string): string {
  const storeUrl = `${VILAFOOD_BASE_URL}/loja/${slug}`;
  if (productId) {
    return `${storeUrl}?product=${productId}&source=localiza`;
  }
  return `${storeUrl}?source=localiza`;
}

export function VilaFoodOrderButton({
  establishmentSlug,
  productId,
  className,
  variant = "default",
  size = "default",
  label = "Pedir no VilaFood",
}: VilaFoodOrderButtonProps) {
  const orderUrl = buildOrderUrl(establishmentSlug, productId);

  const handleClick = () => {
    window.open(orderUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
    >
      <ShoppingBag className="w-4 h-4 mr-2" />
      {label}
      <ExternalLink className="w-3 h-3 ml-1" />
    </Button>
  );
}

export { buildOrderUrl, VILAFOOD_BASE_URL };
