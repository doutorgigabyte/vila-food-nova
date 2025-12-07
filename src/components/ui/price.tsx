import { cn } from "@/lib/utils";

interface PriceProps {
  value: number;
  originalValue?: number;
  size?: "xs" | "sm" | "base" | "lg" | "xl";
  variant?: "default" | "promotional" | "muted";
  showCurrency?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export const Price = ({
  value,
  originalValue,
  size = "sm",
  variant = "default",
  showCurrency = true,
  className,
}: PriceProps) => {
  const formatPrice = (price: number) => {
    return price.toFixed(2).replace(".", ",");
  };

  const hasDiscount = originalValue && originalValue > value;

  return (
    <span className={cn("inline-flex items-center gap-1.5 flex-wrap", className)}>
      {hasDiscount && (
        <span
          className={cn(
            "whitespace-nowrap line-through text-muted-foreground",
            size === "xs" ? "text-[10px]" : size === "sm" ? "text-xs" : "text-sm"
          )}
        >
          {showCurrency && "R$\u00A0"}
          {formatPrice(originalValue)}
        </span>
      )}
      <span
        className={cn(
          "whitespace-nowrap font-bold",
          sizeClasses[size],
          className?.includes("text-white") 
            ? "" // Don't override if text-white is passed
            : variant === "promotional" || hasDiscount
              ? "text-destructive"
              : variant === "muted"
              ? "text-muted-foreground"
              : "text-foreground"
        )}
      >
        {showCurrency && "R$\u00A0"}
        {formatPrice(value)}
      </span>
    </span>
  );
};

// Componente para exibir preço com desconto inline
export const PriceWithDiscount = ({
  price,
  promotionalPrice,
  size = "sm",
  className,
}: {
  price: number;
  promotionalPrice?: number | null;
  size?: "xs" | "sm" | "base" | "lg" | "xl";
  className?: string;
}) => {
  const hasDiscount = promotionalPrice && promotionalPrice < price;
  const displayPrice = hasDiscount ? promotionalPrice : price;

  return (
    <Price
      value={displayPrice}
      originalValue={hasDiscount ? price : undefined}
      size={size}
      variant={hasDiscount ? "promotional" : "default"}
      className={className}
    />
  );
};
