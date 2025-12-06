import { ArrowLeft, Search, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CategoryConfig } from "@/lib/categoryConfig";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CategoryHeaderProps {
  category: CategoryConfig;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const CategoryHeader = ({ category, searchTerm, onSearchChange }: CategoryHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className={`sticky top-0 z-50 ${category.bgColor} border-b border-border`}>
      <div className="container mx-auto px-4 py-4">
        {/* Top row - Back button and title */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-3xl">{category.icon}</span>
            <div>
              <h1 className={`text-xl font-bold ${category.color}`}>{category.name}</h1>
              <p className="text-xs text-muted-foreground">{category.description}</p>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar em ${category.name}...`}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0 bg-background">
            <MapPin className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default CategoryHeader;
