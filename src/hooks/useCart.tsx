import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { safeLocalStorage } from "@/lib/utils";
import { trackAddToCart as trackAddToCartAnalytics } from "@/lib/analytics";

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  establishment_id: string;
  product_type?: string; // 'drink', 'frozen', 'fresh', etc.
  temperature_options?: string[]; // Custom options like ['gelada', 'ambiente']
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
  observation: string;
  selectedTemperature?: 'gelada' | 'ambiente' | 'congelada' | 'in_natura';
}

// Helper to get temperature options based on product type
export const getTemperatureOptions = (productType?: string, customOptions?: string[]): ('gelada' | 'ambiente' | 'congelada' | 'in_natura')[] => {
  // If has custom options, use them
  if (customOptions && customOptions.length > 0) {
    return customOptions as ('gelada' | 'ambiente' | 'congelada' | 'in_natura')[];
  }
  
  // Based on product type
  switch (productType) {
    case 'drink':
      return ['gelada', 'ambiente'];
    case 'frozen':
      return ['congelada'];
    case 'fresh':
      return ['gelada', 'in_natura'];
    default:
      return []; // No temperature selector
  }
};

export interface EstablishmentInfo {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  vila_id: string | null;
  vila_name?: string;
  delivery_base_fee: number;
  min_order_value: number;
  accepts_pickup: boolean;
  accepts_delivery: boolean;
  is_open?: boolean;
  operating_hours?: Record<string, { open: boolean; start: string; end: string }> | null;
}

interface CartContextType {
  items: CartItem[];
  establishments: Map<string, EstablishmentInfo>;
  currentVilaId: string | null;
  isLoaded: boolean;
  addToCart: (product: CartProduct, establishmentInfo: EstablishmentInfo, quantity?: number, observation?: string) => Promise<boolean>;
  updateQuantity: (productId: string, delta: number) => void;
  updateItemTemperature: (productId: string, temperature: CartItem['selectedTemperature']) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  clearEstablishmentCart: (establishmentId: string) => void;
  getEstablishmentItems: (establishmentId: string) => CartItem[];
  getEstablishmentSubtotal: (establishmentId: string) => number;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isMultiEstablishment: () => boolean;
  getUniqueEstablishments: () => string[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "vilafood_cart";
const ESTABLISHMENTS_STORAGE_KEY = "vilafood_cart_establishments";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [establishments, setEstablishments] = useState<Map<string, EstablishmentInfo>>(new Map());
  const [currentVilaId, setCurrentVilaId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const storedItems = safeLocalStorage.getItem(CART_STORAGE_KEY);
      const storedEstablishments = safeLocalStorage.getItem(ESTABLISHMENTS_STORAGE_KEY);
      
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      }
      if (storedEstablishments) {
        const estArr = JSON.parse(storedEstablishments);
        const estMap = new Map<string, EstablishmentInfo>(estArr);
        setEstablishments(estMap);
        
        // Set current vila from first establishment
        if (estArr.length > 0) {
          setCurrentVilaId(estArr[0][1].vila_id);
        }
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      safeLocalStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      safeLocalStorage.setItem(ESTABLISHMENTS_STORAGE_KEY, JSON.stringify(Array.from(establishments.entries())));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [items, establishments]);

  const addToCart = async (
    product: CartProduct,
    establishmentInfo: EstablishmentInfo,
    quantity: number = 1,
    observation: string = ""
  ): Promise<boolean> => {
    // Check vila compatibility
    const existingEstablishmentIds = getUniqueEstablishments();
    
    if (existingEstablishmentIds.length > 0 && !existingEstablishmentIds.includes(product.establishment_id)) {
      // Different establishment - check if same vila
      const newVilaId = establishmentInfo.vila_id;
      
      if (!currentVilaId || !newVilaId || currentVilaId !== newVilaId) {
        // Different vila or no vila - show confirmation dialog
        const confirmed = window.confirm(
          "Você tem itens de outro estabelecimento no carrinho. Deseja esvaziar o carrinho e adicionar este produto?"
        );
        
        if (confirmed) {
          clearCart();
        } else {
          return false;
        }
      } else {
        // Same vila - allow multi-establishment cart
        toast.info(
          "Produto de outro estabelecimento da mesma vila adicionado. No checkout, você terá pedidos separados.",
          { duration: 4000 }
        );
      }
    }

    // Add establishment info if not exists
    if (!establishments.has(product.establishment_id)) {
      const newEstablishments = new Map(establishments);
      newEstablishments.set(product.establishment_id, establishmentInfo);
      setEstablishments(newEstablishments);
      setCurrentVilaId(establishmentInfo.vila_id);
    }

    // Add or update item
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, observation: observation || item.observation }
            : item
        );
      } else {
        return [...prevItems, { product, quantity, observation }];
      }
    });

    // Track analytics event
    try {
      trackAddToCartAnalytics({
        id: product.id,
        name: product.name,
        price: product.promotional_price || product.price,
        quantity
      });
    } catch (err) {
      console.error('[Analytics] Error tracking add to cart:', err);
    }

    return true;
  };

  const updateQuantity = (productId: string, delta: number) => {
    setItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );

    // Clean up establishments with no items
    setTimeout(() => {
      cleanupEstablishments();
    }, 0);
  };

  const updateItemTemperature = (productId: string, temperature: CartItem['selectedTemperature']) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId
          ? { ...item, selectedTemperature: temperature }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
    
    // Clean up establishments with no items
    setTimeout(() => {
      cleanupEstablishments();
    }, 0);
  };

  const cleanupEstablishments = () => {
    setItems((currentItems) => {
      const activeEstablishmentIds = new Set(currentItems.map((item) => item.product.establishment_id));
      
      setEstablishments((prevEstablishments) => {
        const newEstablishments = new Map<string, EstablishmentInfo>();
        prevEstablishments.forEach((info, id) => {
          if (activeEstablishmentIds.has(id)) {
            newEstablishments.set(id, info);
          }
        });
        
        // Update currentVilaId if no more establishments
        if (newEstablishments.size === 0) {
          setCurrentVilaId(null);
        }
        
        return newEstablishments;
      });
      
      return currentItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    setEstablishments(new Map());
    setCurrentVilaId(null);
    safeLocalStorage.removeItem(CART_STORAGE_KEY);
    safeLocalStorage.removeItem(ESTABLISHMENTS_STORAGE_KEY);
  };

  const clearEstablishmentCart = (establishmentId: string) => {
    setItems((prevItems) => 
      prevItems.filter((item) => item.product.establishment_id !== establishmentId)
    );
    
    setEstablishments((prev) => {
      const newMap = new Map(prev);
      newMap.delete(establishmentId);
      return newMap;
    });
  };

  const getEstablishmentItems = (establishmentId: string): CartItem[] => {
    return items.filter((item) => item.product.establishment_id === establishmentId);
  };

  const getEstablishmentSubtotal = (establishmentId: string): number => {
    return getEstablishmentItems(establishmentId).reduce((sum, item) => {
      const price = item.product.promotional_price || item.product.price;
      return sum + price * item.quantity;
    }, 0);
  };

  const getTotalItems = (): number => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = (): number => {
    return items.reduce((sum, item) => {
      const price = item.product.promotional_price || item.product.price;
      return sum + price * item.quantity;
    }, 0);
  };

  const isMultiEstablishment = (): boolean => {
    return getUniqueEstablishments().length > 1;
  };

  const getUniqueEstablishments = (): string[] => {
    return [...new Set(items.map((item) => item.product.establishment_id))];
  };

  return (
    <CartContext.Provider
      value={{
        items,
        establishments,
        currentVilaId,
        isLoaded,
        addToCart,
        updateQuantity,
        updateItemTemperature,
        removeFromCart,
        clearCart,
        clearEstablishmentCart,
        getEstablishmentItems,
        getEstablishmentSubtotal,
        getTotalItems,
        getTotalPrice,
        isMultiEstablishment,
        getUniqueEstablishments,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
