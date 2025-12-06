import { ArrowLeft, Search, MapPin, Bell } from "lucide-react";
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
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Top row - Location and notifications */}
      <div className="flex items-center justify-between px-4 py-2 bg-primary">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2 text-primary-foreground">
          <span className="text-3xl">{category.icon}</span>
          <h1 className="text-lg font-bold">{category.name}</h1>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <Bell className="h-5 w-5" />
        </Button>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-background">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar em ${category.name}...`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-full bg-muted border-0"
          />
        </div>
      </div>
    </header>
  );
};

export default CategoryHeader;
