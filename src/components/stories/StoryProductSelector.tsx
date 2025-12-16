import React, { useState } from 'react';
import { Search, Package, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
}

interface StoryProductSelectorProps {
  establishmentId: string;
  selectedProduct: Product | null;
  onSelect: (product: Product | null) => void;
  onSkip: () => void;
  onBack: () => void;
}

export const StoryProductSelector: React.FC<StoryProductSelectorProps> = ({
  establishmentId,
  selectedProduct,
  onSelect,
  onSkip,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelected, setLocalSelected] = useState<Product | null>(selectedProduct);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-for-story', establishmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, promotional_price, image_url')
        .eq('establishment_id', establishmentId)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!establishmentId
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = () => {
    onSelect(localSelected);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mb-2" />
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => setLocalSelected(localSelected?.id === product.id ? null : product)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  localSelected?.id === product.id
                    ? 'bg-primary/20 border-2 border-primary'
                    : 'bg-muted/50 hover:bg-muted border-2 border-transparent'
                }`}
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.promotional_price ? (
                      <>
                        <span className="line-through mr-2">{formatPrice(product.price)}</span>
                        <span className="text-primary font-medium">
                          {formatPrice(product.promotional_price)}
                        </span>
                      </>
                    ) : (
                      formatPrice(product.price)
                    )}
                  </p>
                </div>
                {localSelected?.id === product.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-border space-y-2">
        <p className="text-xs text-muted-foreground text-center">
          Anexar um produto permite mostrar informações e link direto para compra
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Voltar
          </Button>
          <Button variant="ghost" onClick={onSkip} className="flex-1">
            Pular
          </Button>
          <Button onClick={handleConfirm} className="flex-1" disabled={!localSelected}>
            Usar Produto
          </Button>
        </div>
      </div>
    </div>
  );
};
