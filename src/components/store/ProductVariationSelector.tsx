import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export interface ProductVariation {
  id: string;
  name: string;
  price_modifier?: number;
  is_default?: boolean;
}

export interface VariationGroup {
  name: string;
  required?: boolean;
  options: ProductVariation[];
}

interface ProductVariationSelectorProps {
  variations: VariationGroup[];
  selectedVariations: Record<string, string>;
  onVariationChange: (groupName: string, variationId: string) => void;
}

export const ProductVariationSelector = ({
  variations,
  selectedVariations,
  onVariationChange,
}: ProductVariationSelectorProps) => {
  if (!variations || variations.length === 0) return null;

  return (
    <div className="space-y-4">
      {variations.map((group) => (
        <div key={group.name} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{group.name}</span>
            {group.required && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Obrigatório
              </Badge>
            )}
          </div>
          <RadioGroup
            value={selectedVariations[group.name] || ""}
            onValueChange={(value) => onVariationChange(group.name, value)}
            className="grid grid-cols-2 gap-2"
          >
            {group.options.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label 
                  htmlFor={option.id} 
                  className="flex-1 cursor-pointer text-sm flex items-center justify-between"
                >
                  <span>{option.name}</span>
                  {option.price_modifier && option.price_modifier !== 0 && (
                    <span className={option.price_modifier > 0 ? "text-primary" : "text-green-600"}>
                      {option.price_modifier > 0 ? "+" : ""}R$ {option.price_modifier.toFixed(2)}
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}
    </div>
  );
};
