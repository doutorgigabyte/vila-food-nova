import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
  isActive?: boolean;
}

interface CategoryBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const CategoryBreadcrumb = ({ items, className }: CategoryBreadcrumbProps) => {
  return (
    <nav className={cn("flex items-center gap-1 text-sm overflow-x-auto scrollbar-hide", className)}>
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-1 flex-shrink-0"
        >
          {index > 0 && (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          )}
          
          {item.href && !item.isActive ? (
            <Link
              to={item.href}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full transition-all",
                "hover:bg-muted/80 active:scale-95",
                index === 0 ? "text-muted-foreground" : "text-foreground/80"
              )}
            >
              {index === 0 ? (
                <Home className="w-3.5 h-3.5" />
              ) : item.icon ? (
                <span className="text-sm">{item.icon}</span>
              ) : null}
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          ) : (
            <span
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full",
                item.isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-foreground"
              )}
            >
              {item.icon && <span className="text-sm">{item.icon}</span>}
              <span className="whitespace-nowrap">{item.label}</span>
            </span>
          )}
        </motion.div>
      ))}
    </nav>
  );
};

export default CategoryBreadcrumb;
