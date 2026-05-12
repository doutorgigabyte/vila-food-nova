import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Utensils,
  ShoppingBag,
  Pill,
  ShoppingCart,
  Palette,
  Wrench,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingData } from "../OnboardingWizard";

interface BusinessTypeStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

interface MainCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  utensils: Utensils,
  "shopping-cart": ShoppingCart,
  pill: Pill,
  "shopping-bag": ShoppingBag,
  palette: Palette,
  wrench: Wrench,
};

const defaultIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  comida: Utensils,
  mercado: ShoppingCart,
  farmacia: Pill,
  compras: ShoppingBag,
  artesanato: Palette,
  servicos: Wrench,
};

const categoryDescriptions: Record<string, string> = {
  comida: "Restaurantes, lanchonetes, pizzarias, docerias e mais",
  mercado: "Supermercados, mercearias, conveniências",
  farmacia: "Farmácias, drogarias, produtos de saúde",
  compras: "Lojas de roupas, acessórios, eletrônicos",
  artesanato: "Artesanato local, produtos manuais, decoração",
  servicos: "Serviços profissionais, manutenção, consultorias",
};

export const BusinessTypeStep = ({ data, updateData, onNext }: BusinessTypeStepProps) => {
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    const { data: cats, error: fetchError } = await supabase
      .from("main_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (fetchError) {
      setError(fetchError.message || "Não foi possível carregar as categorias");
    } else if (!cats || cats.length === 0) {
      setError("Nenhuma categoria de negócio disponível no momento. Tente novamente em instantes.");
    } else {
      setCategories(cats);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSelect = (category: MainCategory) => {
    updateData({
      mainCategoryId: category.id,
      mainCategoryName: category.name,
    });
  };

  const handleNext = () => {
    if (data.mainCategoryId) {
      onNext();
    }
  };

  const getIcon = (category: MainCategory) => {
    if (category.icon && iconMap[category.icon]) {
      return iconMap[category.icon];
    }
    return defaultIcons[category.slug] || Utensils;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center space-y-4 border-destructive/30 bg-destructive/5">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <div>
          <h3 className="font-semibold mb-1">Não conseguimos carregar as categorias</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={fetchCategories} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {categories.map((category, index) => {
          const IconComponent = getIcon(category);
          const isSelected = data.mainCategoryId === category.id;
          
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                onClick={() => handleSelect(category)}
                className={`p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  isSelected 
                    ? "border-primary bg-primary/5 ring-2 ring-primary shadow-lg" 
                    : "hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    isSelected 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  }`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {categoryDescriptions[category.slug] || category.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Button 
        onClick={handleNext} 
        disabled={!data.mainCategoryId}
        className="w-full"
        size="lg"
      >
        Continuar
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};
