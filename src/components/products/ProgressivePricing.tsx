import { useState } from "react";
import { Tag, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface PriceTier {
  quantity: number;
  price_per_unit: number;
}

interface ProgressivePricingProps {
  tiers: PriceTier[];
  selectedQuantity: number;
  onQuantitySelect: (quantity: number) => void;
  unitLabel?: string;
}

export const ProgressivePricing = ({
  tiers,
  selectedQuantity,
  onQuantitySelect,
  unitLabel = 'un.',
}: ProgressivePricingProps) => {
  if (tiers.length === 0) return null;

  const sortedTiers = [...tiers].sort((a, b) => a.quantity - b.quantity);
  const basePrice = sortedTiers[0]?.price_per_unit || 0;

  const calculateSavings = (tier: PriceTier) => {
    const regularTotal = basePrice * tier.quantity;
    const discountedTotal = tier.price_per_unit * tier.quantity;
    return regularTotal - discountedTotal;
  };

  const getDiscount = (tier: PriceTier) => {
    if (tier.quantity === sortedTiers[0].quantity) return 0;
    return Math.round(((basePrice - tier.price_per_unit) / basePrice) * 100);
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Leve mais, pague menos!
      </h4>

      <div className="space-y-2">
        {sortedTiers.map((tier) => {
          const isSelected = selectedQuantity === tier.quantity;
          const discount = getDiscount(tier);
          const savings = calculateSavings(tier);

          return (
            <button
              key={tier.quantity}
              type="button"
              onClick={() => onQuantitySelect(tier.quantity)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                )}>
                  {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                </div>
                <div className="text-left">
                  <span className="font-medium">
                    {tier.quantity} {unitLabel}
                  </span>
                  {discount > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      -{discount}%
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-primary">
                  R$ {tier.price_per_unit.toFixed(2)}/{unitLabel}
                </div>
                {savings > 0 && (
                  <div className="text-xs text-green-600">
                    Economize R$ {savings.toFixed(2)}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Resumo */}
      <div className="pt-3 border-t flex justify-between items-center">
        <span className="text-muted-foreground">Total ({selectedQuantity} {unitLabel}):</span>
        <span className="text-xl font-bold text-primary">
          R$ {(sortedTiers.find(t => t.quantity === selectedQuantity)?.price_per_unit || basePrice * selectedQuantity).toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export const ProgressivePricingBadge = ({ tiers }: { tiers: PriceTier[] }) => {
  if (tiers.length <= 1) return null;
  
  const sortedTiers = [...tiers].sort((a, b) => a.quantity - b.quantity);
  const basePrice = sortedTiers[0]?.price_per_unit;
  const bestTier = sortedTiers[sortedTiers.length - 1];
  const maxDiscount = Math.round(((basePrice - bestTier.price_per_unit) / basePrice) * 100);

  if (maxDiscount <= 0) return null;

  return (
    <Badge variant="secondary" className="bg-green-100 text-green-700 gap-1">
      <Tag className="w-3 h-3" />
      Até {maxDiscount}% OFF
    </Badge>
  );
};
