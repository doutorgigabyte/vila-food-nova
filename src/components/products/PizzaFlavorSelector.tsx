import { useState } from "react";
import { Check, X, Pizza } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PizzaFlavor {
  id: string;
  name: string;
  price_modifier?: number;
  description?: string;
}

export interface PizzaSize {
  id: string;
  name: string;
  price: number;
  max_flavors: number;
}

interface PizzaFlavorSelectorProps {
  sizes: PizzaSize[];
  flavors: PizzaFlavor[];
  selectedSize: PizzaSize | null;
  selectedFlavors: PizzaFlavor[];
  onSizeChange: (size: PizzaSize) => void;
  onFlavorToggle: (flavor: PizzaFlavor) => void;
  onClearFlavors: () => void;
}

export const PizzaFlavorSelector = ({
  sizes,
  flavors,
  selectedSize,
  selectedFlavors,
  onSizeChange,
  onFlavorToggle,
  onClearFlavors,
}: PizzaFlavorSelectorProps) => {
  const maxFlavors = selectedSize?.max_flavors || 1;
  const canAddMore = selectedFlavors.length < maxFlavors;

  const calculatePrice = () => {
    if (!selectedSize) return 0;
    const basePrice = selectedSize.price;
    const modifiers = selectedFlavors.reduce((sum, f) => sum + (f.price_modifier || 0), 0);
    return basePrice + (modifiers / selectedFlavors.length || 0);
  };

  return (
    <div className="space-y-4">
      {/* Seleção de Tamanho */}
      <div>
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Pizza className="w-4 h-4" />
          Escolha o tamanho
        </h4>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => {
                onSizeChange(size);
                if (selectedFlavors.length > size.max_flavors) {
                  onClearFlavors();
                }
              }}
              className={cn(
                "px-4 py-2 rounded-lg border-2 transition-all flex flex-col items-center",
                selectedSize?.id === size.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span className="font-medium">{size.name}</span>
              <span className="text-sm">R$ {size.price.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">
                até {size.max_flavors} {size.max_flavors === 1 ? 'sabor' : 'sabores'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Seleção de Sabores */}
      {selectedSize && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">
              Escolha {maxFlavors === 1 ? 'o sabor' : `até ${maxFlavors} sabores`}
            </h4>
            {selectedFlavors.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFlavors}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {/* Sabores selecionados */}
          {selectedFlavors.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedFlavors.map((flavor, index) => (
                <Badge
                  key={flavor.id}
                  variant="default"
                  className="gap-1 cursor-pointer"
                  onClick={() => onFlavorToggle(flavor)}
                >
                  {maxFlavors > 1 && `${index + 1}. `}
                  {flavor.name}
                  {flavor.price_modifier && flavor.price_modifier > 0 && (
                    <span className="text-xs opacity-70">+R${flavor.price_modifier.toFixed(2)}</span>
                  )}
                  <X className="w-3 h-3" />
                </Badge>
              ))}
            </div>
          )}

          {/* Lista de sabores */}
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {flavors.map((flavor) => {
              const isSelected = selectedFlavors.some((f) => f.id === flavor.id);
              const isDisabled = !isSelected && !canAddMore;

              return (
                <button
                  key={flavor.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onFlavorToggle(flavor)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all flex items-center justify-between",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : isDisabled
                      ? "border-border bg-muted opacity-50 cursor-not-allowed"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div>
                    <span className="font-medium text-sm">{flavor.name}</span>
                    {flavor.price_modifier && flavor.price_modifier > 0 && (
                      <span className="text-xs text-muted-foreground block">
                        +R$ {flavor.price_modifier.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>

          {/* Visualização da divisão */}
          {selectedFlavors.length > 1 && (
            <div className="mt-4 flex justify-center">
              <div className="relative w-24 h-24 rounded-full border-4 border-primary overflow-hidden">
                {selectedFlavors.map((flavor, index) => (
                  <div
                    key={flavor.id}
                    className="absolute inset-0 flex items-center justify-center text-xs font-medium"
                    style={{
                      clipPath: selectedFlavors.length === 2
                        ? index === 0
                          ? 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                          : 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)'
                        : `polygon(50% 50%, ${50 + 50 * Math.cos((index * 2 * Math.PI) / selectedFlavors.length - Math.PI / 2)}% ${50 + 50 * Math.sin((index * 2 * Math.PI) / selectedFlavors.length - Math.PI / 2)}%, ${50 + 50 * Math.cos(((index + 1) * 2 * Math.PI) / selectedFlavors.length - Math.PI / 2)}% ${50 + 50 * Math.sin(((index + 1) * 2 * Math.PI) / selectedFlavors.length - Math.PI / 2)}%)`,
                      backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preço calculado */}
      {selectedSize && selectedFlavors.length > 0 && (
        <div className="pt-3 border-t flex justify-between items-center">
          <span className="text-muted-foreground">Preço:</span>
          <span className="text-xl font-bold text-primary">
            R$ {calculatePrice().toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};
