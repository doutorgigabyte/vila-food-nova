import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
// import { motion, AnimatePresence } from "framer-motion"; // Temporarily disabled - needs npm install
import { UserMenu } from "./UserMenu";
import { LocationSelector } from "./LocationSelector";
import CategoryBreadcrumb from "./CategoryBreadcrumb";
import VilaTokStoriesRow from "./VilaTokStoriesRow";

interface CategoryPageHeaderProps {
  categoryName: string;
  categoryIcon?: string;
  categorySlug: string;
  subcategoryName?: string | null;
  subcategoryIcon?: string;
  onSearch?: (term: string) => void;
  showStories?: boolean;
  onBack?: () => void;
}

const CategoryPageHeader = ({
  categoryName,
  categoryIcon,
  categorySlug,
  subcategoryName,
  subcategoryIcon,
  onSearch,
  showStories = true,
  onBack,
}: CategoryPageHeaderProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    onSearch?.("");
  };

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: "Início", href: "/" },
    ...(subcategoryName ? [
      { 
        label: categoryName, 
        href: `/categoria/${categorySlug}`,
        icon: categoryIcon,
      }
    ] : [
      { 
        label: categoryName, 
        icon: categoryIcon,
        isActive: true
      }
    ]),
    ...(subcategoryName ? [{
      label: subcategoryName,
      icon: subcategoryIcon,
      isActive: true
    }] : [])
  ];

  const searchPlaceholder = subcategoryName 
    ? `Buscar em ${subcategoryName}...`
    : `Buscar em ${categoryName}...`;

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
      {/* Main Navigation Bar */}
      <div className="container mx-auto px-4">
        <div className="flex items-center h-14 gap-2">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack || (() => navigate(-1))}
            className="h-9 w-9 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {/* Center: Category Name */}
          <div className="flex-1 min-w-0 text-center">
            <h1 className="font-semibold text-base truncate px-2">
              {subcategoryName || categoryName}
            </h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-0.5">
            <UserMenu />
          </div>
        </div>

        {/* Location Selector - Compact */}
        <LocationSelector onLocationChange={() => {}} />

        {/* Search Bar */}
        <div className="py-2">
          <div className={cn(
            "relative transition-all duration-200",
            isSearchFocused && "scale-[1.01]"
          )}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={cn(
                "pl-10 pr-10 h-10 rounded-xl border-border/50 bg-muted/30",
                "focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                "placeholder:text-muted-foreground/60 text-sm"
              )}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-all animate-in fade-in zoom-in duration-200"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb - Desktop only */}
      <div className="hidden sm:block border-t border-border/30 bg-muted/20 px-4 py-2">
        <div className="container mx-auto">
          <CategoryBreadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {/* Stories Row */}
      {showStories && (
        <div className="border-t border-border/30 bg-muted/20">
          <VilaTokStoriesRow mainCategorySlug={categorySlug} />
        </div>
      )}
    </header>
  );
};

export default CategoryPageHeader;
