import { AlertTriangle, Leaf, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
}

interface ProductNutritionalInfoProps {
  nutritionalInfo?: NutritionalInfo | null;
  allergens?: string[] | null;
  isVegan?: boolean;
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  isLactoseFree?: boolean;
}

const commonAllergens: Record<string, { label: string; icon: string }> = {
  gluten: { label: "Glúten", icon: "🌾" },
  lactose: { label: "Lactose", icon: "🥛" },
  eggs: { label: "Ovos", icon: "🥚" },
  peanuts: { label: "Amendoim", icon: "🥜" },
  tree_nuts: { label: "Castanhas", icon: "🌰" },
  soy: { label: "Soja", icon: "🫘" },
  fish: { label: "Peixe", icon: "🐟" },
  shellfish: { label: "Frutos do Mar", icon: "🦐" },
  wheat: { label: "Trigo", icon: "🌾" },
  sesame: { label: "Gergelim", icon: "🌱" },
};

export const ProductNutritionalInfo = ({
  nutritionalInfo,
  allergens,
  isVegan,
  isVegetarian,
  isGlutenFree,
  isLactoseFree,
}: ProductNutritionalInfoProps) => {
  const hasAllergens = allergens && allergens.length > 0;
  const hasNutritionalInfo = nutritionalInfo && Object.values(nutritionalInfo).some(v => v !== undefined && v !== null);
  const hasDietaryInfo = isVegan || isVegetarian || isGlutenFree || isLactoseFree;

  if (!hasAllergens && !hasNutritionalInfo && !hasDietaryInfo) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Dietary Badges */}
      {hasDietaryInfo && (
        <div className="flex flex-wrap gap-2">
          {isVegan && (
            <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
              <Leaf className="w-3 h-3" />
              Vegano
            </Badge>
          )}
          {isVegetarian && !isVegan && (
            <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
              <Leaf className="w-3 h-3" />
              Vegetariano
            </Badge>
          )}
          {isGlutenFree && (
            <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
              🌾 Sem Glúten
            </Badge>
          )}
          {isLactoseFree && (
            <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
              🥛 Sem Lactose
            </Badge>
          )}
        </div>
      )}

      {/* Allergens Warning */}
      {hasAllergens && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Contém alérgenos
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {allergens.map((allergen) => {
                  const info = commonAllergens[allergen.toLowerCase()];
                  return (
                    <span
                      key={allergen}
                      className="inline-flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full"
                    >
                      {info?.icon || "⚠️"} {info?.label || allergen}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nutritional Info */}
      {hasNutritionalInfo && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg cursor-help">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {nutritionalInfo.calories && `${nutritionalInfo.calories} kcal`}
                  {nutritionalInfo.protein && ` • ${nutritionalInfo.protein}g proteína`}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1 text-sm">
                <p className="font-semibold mb-2">Informação Nutricional</p>
                {nutritionalInfo.calories !== undefined && (
                  <p>Calorias: {nutritionalInfo.calories} kcal</p>
                )}
                {nutritionalInfo.protein !== undefined && (
                  <p>Proteínas: {nutritionalInfo.protein}g</p>
                )}
                {nutritionalInfo.carbs !== undefined && (
                  <p>Carboidratos: {nutritionalInfo.carbs}g</p>
                )}
                {nutritionalInfo.fat !== undefined && (
                  <p>Gorduras: {nutritionalInfo.fat}g</p>
                )}
                {nutritionalInfo.fiber !== undefined && (
                  <p>Fibras: {nutritionalInfo.fiber}g</p>
                )}
                {nutritionalInfo.sodium !== undefined && (
                  <p>Sódio: {nutritionalInfo.sodium}mg</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
