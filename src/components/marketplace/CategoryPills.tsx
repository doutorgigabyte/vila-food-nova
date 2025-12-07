import { useNavigate, useLocation } from "react-router-dom";
import { useMainCategories, getIconComponent } from "@/hooks/useMainCategories";
import { cn } from "@/lib/utils";

interface CategoryPillsProps {
  selectedCategory?: string;
  onCategoryChange?: (slug: string | null) => void;
}

const CategoryPills = ({ selectedCategory, onCategoryChange }: CategoryPillsProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { categories, loading } = useMainCategories();

  const handleCategoryClick = (slug: string) => {
    if (onCategoryChange) {
      onCategoryChange(selectedCategory === slug ? null : slug);
    } else {
      if (selectedCategory === slug) {
        navigate('/');
      } else {
        navigate(`/categoria/${slug}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-muted animate-pulse shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* All categories pill */}
        <button
          onClick={() => {
            if (onCategoryChange) {
              onCategoryChange(null);
            } else {
              navigate('/');
            }
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all duration-200",
            !selectedCategory 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <span>Todos</span>
        </button>

        {categories.map((category) => {
          const IconComponent = getIconComponent(category.icon);
          const isSelected = selectedCategory === category.slug;
          
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.slug)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all duration-200",
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryPills;
