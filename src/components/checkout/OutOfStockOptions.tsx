/**
 * OutOfStockOptions - Opções para quando item estiver em falta
 * Estilo 99Food: "Se o item estiver em falta, o que a loja deve fazer?"
 */

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MessageSquare, XCircle, Package } from 'lucide-react';

export type OutOfStockAction = 'contact_me' | 'cancel_order' | 'cancel_item';

interface OutOfStockOptionsProps {
  value: OutOfStockAction;
  onChange: (value: OutOfStockAction) => void;
}

const options: { value: OutOfStockAction; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'contact_me',
    label: 'Entrar em contato comigo',
    description: 'A loja entrará em contato para combinar uma substituição',
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    value: 'cancel_order',
    label: 'Cancelar o pedido',
    description: 'O pedido completo será cancelado',
    icon: <XCircle className="w-4 h-4" />,
  },
  {
    value: 'cancel_item',
    label: 'Cancelar apenas o que está em falta',
    description: 'Remover apenas os itens indisponíveis e continuar',
    icon: <Package className="w-4 h-4" />,
  },
];

export function OutOfStockOptions({ value, onChange }: OutOfStockOptionsProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-muted-foreground">
        Se o item estiver em falta, o que a loja deve fazer?
      </div>
      
      <RadioGroup value={value} onValueChange={(v) => onChange(v as OutOfStockAction)}>
        <div className="space-y-2">
          {options.map((option) => (
            <div
              key={option.value}
              className={`
                flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${value === option.value 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
                }
              `}
              onClick={() => onChange(option.value)}
            >
              <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <Label 
                  htmlFor={option.value} 
                  className="flex items-center gap-2 font-medium cursor-pointer"
                >
                  <span className="text-muted-foreground">{option.icon}</span>
                  {option.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
