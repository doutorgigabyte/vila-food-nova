import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { safeSessionStorage } from "@/lib/utils";

export type OrderSource = 'marketplace' | 'direct' | 'pdv' | 'whatsapp';

interface OrderSourceContextType {
  source: OrderSource;
  setSource: (source: OrderSource) => void;
  platformFeePercent: number;
  shouldApplyPlatformFee: boolean;
}

const OrderSourceContext = createContext<OrderSourceContextType | undefined>(undefined);

const ORDER_SOURCE_KEY = "vilafood_order_source";
const PLATFORM_FEE_PERCENT = 5; // 5% platform fee for marketplace orders

export const OrderSourceProvider = ({ children }: { children: ReactNode }) => {
  const [source, setSourceState] = useState<OrderSource>('direct');

  // Load source from sessionStorage on mount
  useEffect(() => {
    try {
      const storedSource = safeSessionStorage.getItem(ORDER_SOURCE_KEY) as OrderSource;
      if (storedSource && ['marketplace', 'direct', 'pdv', 'whatsapp'].includes(storedSource)) {
        setSourceState(storedSource);
      }
    } catch (error) {
      console.error("Error loading order source:", error);
    }
  }, []);

  const setSource = (newSource: OrderSource) => {
    setSourceState(newSource);
    try {
      safeSessionStorage.setItem(ORDER_SOURCE_KEY, newSource);
    } catch (error) {
      console.error("Error saving order source:", error);
    }
  };

  const shouldApplyPlatformFee = source === 'marketplace';
  const platformFeePercent = shouldApplyPlatformFee ? PLATFORM_FEE_PERCENT : 0;

  return (
    <OrderSourceContext.Provider
      value={{
        source,
        setSource,
        platformFeePercent,
        shouldApplyPlatformFee,
      }}
    >
      {children}
    </OrderSourceContext.Provider>
  );
};

export const useOrderSource = () => {
  const context = useContext(OrderSourceContext);
  if (!context) {
    throw new Error("useOrderSource must be used within an OrderSourceProvider");
  }
  return context;
};

// Helper function to set source from outside React context
export const setOrderSourceDirect = (source: OrderSource) => {
  try {
    sessionStorage.setItem(ORDER_SOURCE_KEY, source);
  } catch (error) {
    console.error("Error setting order source:", error);
  }
};

export const getOrderSourceDirect = (): OrderSource => {
  try {
    const source = safeSessionStorage.getItem(ORDER_SOURCE_KEY) as OrderSource;
    if (source && ['marketplace', 'direct', 'pdv', 'whatsapp'].includes(source)) {
      return source;
    }
  } catch (error) {
    console.error("Error getting order source:", error);
  }
  return 'direct';
};