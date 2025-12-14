import { Bike, Clock } from "lucide-react";

interface DeliveryFeePreviewProps {
  baseFee: number;
  avgDeliveryTime?: number;
  freeDeliveryMinValue?: number;
  minOrderValue?: number;
}

export const DeliveryFeePreview = ({
  baseFee,
  avgDeliveryTime = 45,
  freeDeliveryMinValue,
  minOrderValue,
}: DeliveryFeePreviewProps) => {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        <Bike className="w-4 h-4 text-primary" />
        <span>
          {baseFee > 0 ? (
            <>
              <span className="font-semibold">R$ {baseFee.toFixed(2)}</span>
              {freeDeliveryMinValue && freeDeliveryMinValue > 0 && (
                <span className="text-muted-foreground text-xs ml-1">
                  (grátis acima de R$ {freeDeliveryMinValue.toFixed(2)})
                </span>
              )}
            </>
          ) : (
            <span className="text-green-600 font-semibold">Grátis</span>
          )}
        </span>
      </div>
      
      <div className="w-px h-4 bg-border" />
      
      <div className="flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">{avgDeliveryTime} min</span>
      </div>
      
      {minOrderValue && minOrderValue > 0 && (
        <>
          <div className="w-px h-4 bg-border" />
          <span className="text-xs text-muted-foreground">
            Mín: R$ {minOrderValue.toFixed(2)}
          </span>
        </>
      )}
    </div>
  );
};
