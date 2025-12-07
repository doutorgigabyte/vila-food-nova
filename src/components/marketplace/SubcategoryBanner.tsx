import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SubcategoryBannerProps {
  name: string;
  icon?: string;
  productCount?: number;
  storeCount?: number;
  onClear: () => void;
  colorClass?: string;
}

const SubcategoryBanner = ({
  name,
  icon,
  productCount = 0,
  storeCount = 0,
  onClear,
  colorClass = "from-primary/15 to-primary/5 border-primary/20",
}: SubcategoryBannerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border-2",
        "bg-gradient-to-r",
        colorClass
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative flex items-center justify-between p-4 md:p-5">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm border border-border/50">
            <span className="text-2xl md:text-3xl">{icon || "📦"}</span>
          </div>

          {/* Info */}
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              {name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
              {productCount > 0 && (
                <span>{productCount} produtos</span>
              )}
              {productCount > 0 && storeCount > 0 && (
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              )}
              {storeCount > 0 && (
                <span>{storeCount} lojas</span>
              )}
              {productCount === 0 && storeCount === 0 && (
                <span>Explorando...</span>
              )}
            </div>
          </div>
        </div>

        {/* Clear Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-9 px-3 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-background/60"
        >
          <span className="hidden sm:inline text-sm">Limpar</span>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default SubcategoryBanner;
