import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  ShoppingCart, Pill, ShoppingBag, UtensilsCrossed, Palette, Package, Wrench,
  Pizza, Beef, Utensils, Sandwich, IceCream, Croissant, Grape, Fish, CupSoda,
  Sparkles, Home, Smartphone, Shirt, Dog, LucideIcon, Store
} from "lucide-react";

export interface MainCategory {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  description: string | null;
  bg_color: string | null;
  icon_color: string | null;
  border_color: string | null;
  image_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

export interface Subcategory {
  id: string;
  name: string;
  icon: string | null;
  is_active: boolean | null;
  parent_category_id: string | null;
  parent_category_slug?: string;
}

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  "shopping-cart": ShoppingCart,
  "pill": Pill,
  "shopping-bag": ShoppingBag,
  "utensils-crossed": UtensilsCrossed,
  "utensils": Utensils,
  "palette": Palette,
  "package": Package,
  "wrench": Wrench,
  "pizza": Pizza,
  "beef": Beef,
  "sandwich": Sandwich,
  "ice-cream": IceCream,
  "croissant": Croissant,
  "grape": Grape,
  "fish": Fish,
  "cup-soda": CupSoda,
  "sparkles": Sparkles,
  "home": Home,
  "smartphone": Smartphone,
  "shirt": Shirt,
  "dog": Dog,
};

export const getIconComponent = (iconName: string | null): LucideIcon => {
  if (!iconName) return Store;
  return iconMap[iconName] || Store;
};

export const useMainCategories = () => {
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("main_categories")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error("Error fetching main categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading };
};

export const useSubcategories = (parentCategorySlug?: string | null) => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        let query = supabase
          .from("segments")
          .select(`
            id,
            name,
            icon,
            is_active,
            parent_category_id,
            main_categories!inner(slug)
          `)
          .eq("is_active", true)
          .order("name");

        if (parentCategorySlug) {
          query = query.eq("main_categories.slug", parentCategorySlug);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        const mapped = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          icon: item.icon,
          is_active: item.is_active,
          parent_category_id: item.parent_category_id,
          parent_category_slug: item.main_categories?.slug,
        }));
        
        setSubcategories(mapped);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategories();
  }, [parentCategorySlug]);

  return { subcategories, loading };
};
