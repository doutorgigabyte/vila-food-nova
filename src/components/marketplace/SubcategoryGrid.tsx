import { Subcategory } from "@/lib/categoryConfig";

interface SubcategoryGridProps {
  subcategories: Subcategory[];
  selectedSubcategory: string | null;
  onSubcategoryClick: (subcategoryId: string) => void;
  categoryColor: string;
  categoryBgColor: string;
}

// Color palette for subcategory cards
const subcategoryColors = [
  { bg: "bg-blue-50", border: "border-blue-100" },
  { bg: "bg-pink-50", border: "border-pink-100" },
  { bg: "bg-amber-50", border: "border-amber-100" },
  { bg: "bg-green-50", border: "border-green-100" },
  { bg: "bg-purple-50", border: "border-purple-100" },
  { bg: "bg-red-50", border: "border-red-100" },
  { bg: "bg-cyan-50", border: "border-cyan-100" },
  { bg: "bg-orange-50", border: "border-orange-100" },
  { bg: "bg-indigo-50", border: "border-indigo-100" },
  { bg: "bg-teal-50", border: "border-teal-100" },
  { bg: "bg-rose-50", border: "border-rose-100" },
  { bg: "bg-emerald-50", border: "border-emerald-100" },
];

const SubcategoryGrid = ({
  subcategories,
  selectedSubcategory,
  onSubcategoryClick,
  categoryColor,
  categoryBgColor,
}: SubcategoryGridProps) => {
  return (
    <div className="py-6 bg-card">
      <h2 className="text-lg font-semibold mb-4 px-4">Categorias</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 px-4">
        {subcategories.map((subcategory, index) => {
          const isSelected = selectedSubcategory === subcategory.id;
          const colorSet = subcategoryColors[index % subcategoryColors.length];
          
          return (
            <button
              key={subcategory.id}
              onClick={() => onSubcategoryClick(subcategory.id)}
              className={`
                flex flex-col items-center justify-center p-4 rounded-2xl
                transition-all duration-200 hover:shadow-md hover:-translate-y-1
                border
                ${isSelected 
                  ? `ring-2 ring-primary shadow-lg ${colorSet.bg} ${colorSet.border}` 
                  : `${colorSet.bg} ${colorSet.border} hover:shadow-lg`
                }
              `}
            >
              <div className="w-14 h-14 flex items-center justify-center mb-2">
                <span className="text-4xl">{subcategory.icon}</span>
              </div>
              <span className={`text-xs font-medium text-center leading-tight text-foreground`}>
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
