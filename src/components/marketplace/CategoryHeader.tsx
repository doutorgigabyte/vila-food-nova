import { ArrowLeft, Search } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { CategoryConfig } from "@/lib/categoryConfig";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";
import { LocationSelector } from "./LocationSelector";
import { NotificationCenter } from "@/components/notifications";

interface CategoryHeaderProps {
  category: CategoryConfig;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const CategoryHeader = ({ category, searchTerm, onSearchChange }: CategoryHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Top row - Navigation, Logo, Actions */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/80">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-foreground">VilaFood</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <NotificationCenter />
          <UserMenu />
        </div>
      </div>

      {/* Location Selector */}
      <div className="px-4 py-2 bg-muted/50 border-b border-border">
        <LocationSelector />
      </div>

      {/* Category Title with Icon */}
      <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-muted/50 to-background">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md"
          style={{ backgroundColor: category.bgColor }}
        >
          {category.icon}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{category.name}</h1>
          <p className="text-sm text-muted-foreground">
            Explore as melhores opções
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-background">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar em ${category.name}...`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-full bg-muted border-0 h-11"
          />
        </div>
      </div>
    </header>
  );
};

export default CategoryHeader;
