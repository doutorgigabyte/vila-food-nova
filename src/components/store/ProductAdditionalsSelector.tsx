import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

export interface ProductAdditional {
  id: string;
  name: string;
  price: number;
  max_quantity?: number;
  group?: string;
}

export interface AdditionalGroup {
  name: string;
  required?: boolean;
  min_selection?: number;
  max_selection?: number;
  items: ProductAdditional[];
}

export interface SelectedAdditional {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ProductAdditionalsSelectorProps {
  additionals: AdditionalGroup[];
  selectedAdditionals: SelectedAdditional[];
  onAdditionalsChange: (additionals: SelectedAdditional[]) => void;
}

export const ProductAdditionalsSelector = ({
  additionals,
  selectedAdditionals,
  onAdditionalsChange,
}: ProductAdditionalsSelectorProps) => {
  if (!additionals || additionals.length === 0) return null;

  const getSelectedQuantity = (id: string) => {
    return selectedAdditionals.find(a => a.id === id)?.quantity || 0;
  };

  const handleToggle = (item: ProductAdditional, groupName: string) => {
    const existing = selectedAdditionals.find(a => a.id === item.id);
    if (existing) {
      onAdditionalsChange(selectedAdditionals.filter(a => a.id !== item.id));
    } else {
      onAdditionalsChange([
        ...selectedAdditionals,
        { id: item.id, name: item.name, price: item.price, quantity: 1 }
      ]);
    }
  };

  const handleQuantityChange = (item: ProductAdditional, delta: number) => {
    const existing = selectedAdditionals.find(a => a.id === item.id);
    const maxQty = item.max_quantity || 10;
    
    if (!existing && delta > 0) {
      onAdditionalsChange([
        ...selectedAdditionals,
        { id: item.id, name: item.name, price: item.price, quantity: 1 }
      ]);
    } else if (existing) {
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        onAdditionalsChange(selectedAdditionals.filter(a => a.id !== item.id));
      } else if (newQty <= maxQty) {
        onAdditionalsChange(
          selectedAdditionals.map(a =>
            a.id === item.id ? { ...a, quantity: newQty } : a
          )
        );
      }
    }
  };

  const getGroupSelectedCount = (group: AdditionalGroup) => {
    return group.items.reduce((sum, item) => sum + getSelectedQuantity(item.id), 0);
  };

  return (
    <div className="space-y-4">
      {additionals.map((group) => {
        const selectedCount = getGroupSelectedCount(group);
        const isMaxReached = group.max_selection ? selectedCount >= group.max_selection : false;

        return (
          <div key={group.name} className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{group.name}</span>
              {group.required && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Obrigatório
                </Badge>
              )}
              {group.min_selection && group.min_selection > 0 && (
                <span className="text-xs text-muted-foreground">
                  (mín. {group.min_selection})
                </span>
              )}
              {group.max_selection && (
                <span className="text-xs text-muted-foreground">
                  ({selectedCount}/{group.max_selection})
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              {group.items.map((item) => {
                const qty = getSelectedQuantity(item.id);
                const isSelected = qty > 0;
                const canAdd = !isMaxReached || isSelected;
                const showQuantityControls = item.max_quantity && item.max_quantity > 1;

                return (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {!showQuantityControls ? (
                        <Checkbox
                          id={item.id}
                          checked={isSelected}
                          disabled={!canAdd && !isSelected}
                          onCheckedChange={() => handleToggle(item, group.name)}
                        />
                      ) : null}
                      <Label 
                        htmlFor={item.id} 
                        className="cursor-pointer text-sm"
                      >
                        {item.name}
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-primary font-medium">
                        +R$ {item.price.toFixed(2)}
                      </span>
                      
                      {showQuantityControls && (
                        <div className="flex items-center gap-1 bg-background rounded-full p-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleQuantityChange(item, -1)}
                            disabled={qty === 0}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-5 text-center text-sm font-medium">{qty}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleQuantityChange(item, 1)}
                            disabled={!canAdd || qty >= (item.max_quantity || 10)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
