import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Zap, Bike, Store, Clock, MapPin } from "lucide-react";
import { Price } from "@/components/ui/price";
import { cn } from "@/lib/utils";

interface DeliveryOption {
  id: string;
  label: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  badge?: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface DeliveryOptionsCardsProps {
  selectedOption: string;
  onOptionChange: (option: string) => void;
  // Standard delivery fee
  deliveryFee: number;
  // Turbo delivery fee (separate from standard)
  turboFee?: number;
  // Availability flags
  standardAvailable?: boolean;
  turboAvailable?: boolean;
  // Time estimates
  estimatedTime?: { min: number; max: number };
  turboTime?: { min: number; max: number };
  // Distance info
  pickupDistance?: string;
  // Free/minimum zone info
  isFreeZone?: boolean;
  // Store constraints
  isMultiStore?: boolean;
  acceptsDelivery?: boolean;
  acceptsPickup?: boolean;
}

export const DeliveryOptionsCards = ({
  selectedOption,
  onOptionChange,
  deliveryFee,
  turboFee,
  standardAvailable = true,
  turboAvailable = true,
  estimatedTime = { min: 25, max: 40 },
  turboTime = { min: 10, max: 20 },
  pickupDistance,
  isFreeZone = false,
  isMultiStore = false,
  acceptsDelivery = true,
  acceptsPickup = true,
}: DeliveryOptionsCardsProps) => {
  // Use turboFee if provided, otherwise calculate a higher fee
  const actualTurboFee = turboFee !== undefined ? turboFee : Math.max(deliveryFee * 1.5, deliveryFee + 5);
  
  // Build options with fixed times that don't change based on selection
  const turboDescription = `${turboTime.min}-${turboTime.max} min`;
  const deliveryDescription = `${estimatedTime.min}-${estimatedTime.max} min`;
  const pickupDescription = pickupDistance || "No local";

  const options: DeliveryOption[] = [
    {
      id: "turbo",
      label: "Turbo",
      description: turboDescription,
      price: actualTurboFee,
      icon: <Zap className="w-5 h-5" />,
      badge: "Rápido",
      disabled: isMultiStore || !acceptsDelivery || !turboAvailable,
      disabledReason: isMultiStore 
        ? "Indisponível para múltiplas lojas" 
        : !acceptsDelivery 
          ? "Loja não aceita entrega"
          : !turboAvailable
            ? "Turbo indisponível para este endereço"
            : undefined,
    },
    {
      id: "delivery",
      label: "Entrega",
      description: deliveryDescription,
      price: deliveryFee,
      icon: <Bike className="w-5 h-5" />,
      badge: isFreeZone ? "Grátis" : undefined,
      disabled: isMultiStore || !acceptsDelivery || !standardAvailable,
      disabledReason: isMultiStore 
        ? "Indisponível para múltiplas lojas" 
        : !acceptsDelivery 
          ? "Loja não aceita entrega"
          : !standardAvailable
            ? "Entrega indisponível para este endereço"
            : undefined,
    },
    {
      id: "pickup",
      label: "Retirada",
      description: pickupDescription,
      price: 0,
      icon: <Store className="w-5 h-5" />,
      disabled: !acceptsPickup,
      disabledReason: "Loja não aceita retirada",
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        Opções de entrega
      </h3>

      <RadioGroup value={selectedOption} onValueChange={onOptionChange}>
        <div className="space-y-2">
          {options.map((option) => {
            const isSelected = selectedOption === option.id;
            const isDisabled = option.disabled;

            return (
              <Card
                key={option.id}
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  isSelected && !isDisabled && "ring-2 ring-primary border-primary",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !isDisabled && onOptionChange(option.id)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <RadioGroupItem
                    value={option.id}
                    id={option.id}
                    disabled={isDisabled}
                    className="sr-only"
                  />
                  
                  <div className={cn(
                    "p-2.5 rounded-xl transition-colors",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {option.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{option.label}</span>
                      {option.badge && (
                        <Badge 
                          variant="default" 
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4 border-0",
                            option.badge === "Grátis" 
                              ? "bg-green-500/20 text-green-600" 
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          {option.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {option.id === "pickup" ? (
                        <>
                          <MapPin className="w-3 h-3" />
                          {option.description}
                        </>
                      ) : (
                        option.description
                      )}
                    </p>
                    {isDisabled && option.disabledReason && (
                      <p className="text-xs text-destructive mt-0.5">{option.disabledReason}</p>
                    )}
                  </div>

                  <div className="text-right">
                    {option.price === 0 ? (
                      <span className="text-sm font-bold text-green-600">Grátis</span>
                    ) : (
                      <Price value={option.price} size="sm" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </RadioGroup>

      {isMultiStore && (
        <p className="text-xs text-amber-600 bg-amber-500/10 rounded-lg p-2 flex items-center gap-2">
          <Store className="w-4 h-4" />
          Pedidos de múltiplas lojas só aceitam retirada
        </p>
      )}
    </div>
  );
};
