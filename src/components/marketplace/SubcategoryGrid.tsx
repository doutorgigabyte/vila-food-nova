import { Subcategory } from "@/lib/categoryConfig";

interface SubcategoryGridProps {
  subcategories: Subcategory[];
  selectedSubcategory: string | null;
  onSubcategoryClick: (subcategoryId: string) => void;
  categoryColor: string;
  categoryBgColor: string;
}

const SubcategoryGrid = ({
  subcategories,
  selectedSubcategory,
  onSubcategoryClick,
  categoryColor,
  categoryBgColor,
}: SubcategoryGridProps) => {
  return (
    <div className="py-6">
      <h2 className="text-lg font-semibold mb-4 px-4">Categorias</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 px-4">
        {subcategories.map((subcategory) => {
          const isSelected = selectedSubcategory === subcategory.id;
          return (
            <button
              key={subcategory.id}
              onClick={() => onSubcategoryClick(subcategory.id)}
              className={`
                flex flex-col items-center justify-center p-4 rounded-xl
                transition-all duration-200 hover:scale-105
                ${isSelected 
                  ? `${categoryBgColor} ring-2 ring-offset-2 ring-primary shadow-lg` 
                  : 'bg-card hover:bg-accent border border-border'
                }
              `}
            >
              <span className="text-3xl mb-2">{subcategory.icon}</span>
              <span className={`text-xs font-medium text-center leading-tight ${isSelected ? categoryColor : 'text-foreground'}`}>
                {subcategory.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SubcategoryGrid;
