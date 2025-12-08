import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingData } from "../OnboardingWizard";

interface SubcategoriesStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface Segment {
  id: string;
  name: string;
  icon: string | null;
}

export const SubcategoriesStep = ({ data, updateData, onNext, onBack }: SubcategoriesStepProps) => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSegments = async () => {
      if (!data.mainCategoryId) return;

      const { data: segs, error } = await supabase
        .from("segments")
        .select("id, name, icon")
        .eq("parent_category_id", data.mainCategoryId)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (!error && segs) {
        setSegments(segs);
      }
      setLoading(false);
    };

    fetchSegments();
  }, [data.mainCategoryId]);

  const toggleSegment = (segmentId: string) => {
    const current = data.selectedSegments;
    const isSelected = current.includes(segmentId);
    
    if (isSelected) {
      updateData({
        selectedSegments: current.filter(id => id !== segmentId)
      });
    } else {
      updateData({
        selectedSegments: [...current, segmentId]
      });
    }
  };

  const handleNext = () => {
    if (data.selectedSegments.length > 0) {
      onNext();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 w-32 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-semibold mb-1">
            Quais categorias você trabalha?
          </h3>
          <p className="text-sm text-muted-foreground">
            Selecione todas que se aplicam ao seu negócio
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {segments.map((segment, index) => {
            const isSelected = data.selectedSegments.includes(segment.id);
            
            return (
              <motion.div
                key={segment.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Badge
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer text-sm py-2 px-4 transition-all ${
                    isSelected 
                      ? "bg-primary hover:bg-primary/90" 
                      : "hover:bg-primary/10"
                  }`}
                  onClick={() => toggleSegment(segment.id)}
                >
                  {isSelected && <Check className="w-3 h-3 mr-1" />}
                  {segment.name}
                </Badge>
              </motion.div>
            );
          })}
        </div>

        {data.selectedSegments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20"
          >
            <p className="text-sm">
              <span className="font-medium text-primary">
                {data.selectedSegments.length}
              </span>
              {" "}categoria{data.selectedSegments.length !== 1 ? "s" : ""} selecionada{data.selectedSegments.length !== 1 ? "s" : ""}
            </p>
          </motion.div>
        )}
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={data.selectedSegments.length === 0}
          className="flex-1"
        >
          Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
