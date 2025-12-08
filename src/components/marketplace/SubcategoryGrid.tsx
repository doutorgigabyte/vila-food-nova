import { Subcategory } from "@/lib/categoryConfig";
import { cn } from "@/lib/utils";
// import { motion } from "framer-motion"; // Temporarily disabled - needs npm install

interface SubcategoryGridProps {
  subcategories: Subcategory[];
  selectedSubcategory: string | null;
  onSubcategoryClick: (subcategoryId: string) => void;
  categoryColor: string;
  categoryBgColor: string;
}

// Color palette for subcategory cards with dark mode support
const subcategoryColors = [
  { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", icon: "bg-blue-100 dark:bg-blue-900/50" },
  { bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-200 dark:border-pink-800", icon: "bg-pink-100 dark:bg-pink-900/50" },
  { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", icon: "bg-amber-100 dark:bg-amber-900/50" },
  { bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800", icon: "bg-green-100 dark:bg-green-900/50" },
  { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-800", icon: "bg-purple-100 dark:bg-purple-900/50" },
  { bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", icon: "bg-red-100 dark:bg-red-900/50" },
  { bg: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-800", icon: "bg-cyan-100 dark:bg-cyan-900/50" },
  { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800", icon: "bg-orange-100 dark:bg-orange-900/50" },
  { bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-800", icon: "bg-indigo-100 dark:bg-indigo-900/50" },
  { bg: "bg-teal-50 dark:bg-teal-950/30", border: "border-teal-200 dark:border-teal-800", icon: "bg-teal-100 dark:bg-teal-900/50" },
  { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-800", icon: "bg-rose-100 dark:bg-rose-900/50" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", icon: "bg-emerald-100 dark:bg-emerald-900/50" },
];

const SubcategoryGrid = ({
  subcategories,
  selectedSubcategory,
  onSubcategoryClick,
  categoryColor,
  categoryBgColor,
}: SubcategoryGridProps) => {
  return (
    <section className="py-6 bg-card">
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-lg font-bold text-foreground">Subcategorias</h2>
        <span className="text-sm text-muted-foreground">{subcategories.length} opções</span>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 px-4">
        {subcategories.map((subcategory, index) => {
          const isSelected = selectedSubcategory === subcategory.id;
          const colorSet = subcategoryColors[index % subcategoryColors.length];
          
          return (
            <button
              key={subcategory.id}
              onClick={() => onSubcategoryClick(subcategory.id)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 border touch-target active:scale-95 animate-in fade-in slide-in-from-bottom-2",
                isSelected 
                  ? "ring-2 ring-primary shadow-lg scale-105" 
                  : "hover:shadow-lg hover:-translate-y-1",
                colorSet.bg,
                colorSet.border
              )}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-2",
                colorSet.icon
              )}>
                <span className="text-2xl">{subcategory.icon}</span>
              </div>
              <span className="text-xs font-medium text-center leading-tight text-foreground line-clamp-2">
                {subcategory.name}
              </span>
              {isSelected && (
                <div 
                  className="w-1.5 h-1.5 rounded-full bg-primary mt-1 animate-in zoom-in duration-300"
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default SubcategoryGrid;
