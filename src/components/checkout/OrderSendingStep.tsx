/**
 * OrderSendingStep - Tela "Enviando pedido" estilo 99Food
 * Mostra checklist animado com countdown de 5 segundos
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MapPin, Clock, CreditCard, ShoppingBag, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/ui/price';

interface ChecklistItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}

interface OrderSendingStepProps {
  items: ChecklistItem[];
  total: number;
  onComplete: () => void;
  onModify: () => void;
  autoCompleteSeconds?: number;
}

export function OrderSendingStep({
  items,
  total,
  onComplete,
  onModify,
  autoCompleteSeconds = 5,
}: OrderSendingStepProps) {
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(autoCompleteSeconds);
  const [allComplete, setAllComplete] = useState(false);

  // Animate checklist items one by one - use stable item IDs
  useEffect(() => {
    // Capture item IDs at effect start to avoid issues with items changing
    const itemIds = items.map(i => i.id);
    let currentIndex = 0;
    
    // Reset state when items change
    setCompletedItems([]);
    setAllComplete(false);

    const interval = setInterval(() => {
      if (currentIndex < itemIds.length) {
        const idToAdd = itemIds[currentIndex];
        setCompletedItems(prev => {
          // Avoid duplicates
          if (prev.includes(idToAdd)) return prev;
          return [...prev, idToAdd];
        });
        currentIndex++;
      } else {
        clearInterval(interval);
        setAllComplete(true);
      }
    }, 400); // 400ms between each item

    return () => clearInterval(interval);
  }, [items.length]); // Only depend on items length to avoid re-running on same items

  // Countdown after all items are complete
  useEffect(() => {
    if (!allComplete) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [allComplete, onComplete]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-center">Enviando pedido</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-md">
        <div className="space-y-4">
          <AnimatePresence>
            {items.map((item, index) => {
              const isComplete = completedItems.includes(item.id);
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border"
                >
                  {/* Check circle */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                    ${isComplete 
                      ? 'bg-green-500 text-white' 
                      : 'bg-muted border-2 border-border'
                    }
                  `}>
                    {isComplete && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                    )}
                  </div>

                  {/* Icon and content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <p className="font-medium truncate">{item.value}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: allComplete ? 1 : 0.5, y: 0 }}
          transition={{ delay: items.length * 0.1 + 0.3 }}
          className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total</span>
            <Price value={total} size="lg" variant="default" />
          </div>
        </motion.div>
      </main>

      {/* Footer buttons */}
      <footer className="sticky bottom-0 bg-background border-t p-4 space-y-3">
        <Button 
          className="w-full h-12 text-lg relative overflow-hidden"
          onClick={onComplete}
          disabled={!allComplete}
        >
          {allComplete ? (
            <>
              <span>OK</span>
              <span className="ml-2 text-sm opacity-70">({countdown}s)</span>
            </>
          ) : (
            <span>Processando...</span>
          )}
          
          {/* Progress bar */}
          {allComplete && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-primary-foreground/30"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: autoCompleteSeconds, ease: 'linear' }}
            />
          )}
        </Button>

        <Button 
          variant="ghost" 
          className="w-full"
          onClick={onModify}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Modificar
        </Button>
      </footer>
    </div>
  );
}

// Helper to create checklist items
export function createChecklistItems(params: {
  address?: string;
  deliveryTime?: string;
  paymentMethod: string;
  itemsSummary: string;
}): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  if (params.address) {
    items.push({
      id: 'address',
      icon: <MapPin className="w-4 h-4" />,
      label: 'Endereço',
      value: params.address,
    });
  }

  if (params.deliveryTime) {
    items.push({
      id: 'time',
      icon: <Clock className="w-4 h-4" />,
      label: 'Entrega estimada',
      value: params.deliveryTime,
    });
  }

  items.push({
    id: 'payment',
    icon: <CreditCard className="w-4 h-4" />,
    label: 'Pagamento',
    value: params.paymentMethod,
  });

  items.push({
    id: 'items',
    icon: <ShoppingBag className="w-4 h-4" />,
    label: 'Itens do pedido',
    value: params.itemsSummary,
  });

  return items;
}
