import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Check, Plus, AlertCircle, RefreshCw } from "lucide-react";
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

const OTHER_SEGMENT_ID = "other";

export const SubcategoriesStep = ({ data, updateData, onNext, onBack }: SubcategoriesStepProps) => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(data.selectedSegments.includes(OTHER_SEGMENT_ID));

  const fetchSegments = async () => {
    if (!data.mainCategoryId) return;
    setLoading(true);
    setFetchError(null);

    const { data: segs, error } = await supabase
      .from("segments")
      .select("id, name, icon")
      .eq("parent_category_id", data.mainCategoryId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      setFetchError(error.message || "Não foi possível carregar os segmentos");
    } else {
      setSegments(segs || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSegments();
  }, [data.mainCategoryId]);

  const toggleSegment = (segmentId: string) => {
    if (segmentId === OTHER_SEGMENT_ID) {
      const isSelected = data.selectedSegments.includes(OTHER_SEGMENT_ID);
      if (isSelected) {
        updateData({
          selectedSegments: data.selectedSegments.filter(id => id !== OTHER_SEGMENT_ID),
          customSegment: ""
        });
        setShowCustomInput(false);
      } else {
        updateData({
          selectedSegments: [...data.selectedSegments, OTHER_SEGMENT_ID]
        });
        setShowCustomInput(true);
      }
      return;
    }

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

  const handleCustomSegmentChange = (value: string) => {
    updateData({ customSegment: value });
  };

  const handleNext = () => {
    const hasValidSelection = data.selectedSegments.filter(id => id !== OTHER_SEGMENT_ID).length > 0;
    const hasValidCustom = data.selectedSegments.includes(OTHER_SEGMENT_ID) && data.customSegment.trim().length > 0;
    
    if (hasValidSelection || hasValidCustom) {
      onNext();
    }
  };

  const isNextDisabled = () => {
    const regularSegments = data.selectedSegments.filter(id => id !== OTHER_SEGMENT_ID);
    const hasOther = data.selectedSegments.includes(OTHER_SEGMENT_ID);
    
    if (regularSegments.length > 0) return false;
    if (hasOther && data.customSegment.trim().length > 0) return false;
    return true;
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

  if (fetchError) {
    return (
      <Card className="p-8 text-center space-y-4 border-destructive/30 bg-destructive/5">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <div>
          <h3 className="font-semibold mb-1">Não conseguimos carregar os segmentos</h3>
          <p className="text-sm text-muted-foreground">{fetchError}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={fetchSegments}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </Card>
    );
  }

  const isOtherSelected = data.selectedSegments.includes(OTHER_SEGMENT_ID);

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
          
          {/* Opção "Outro" */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: segments.length * 0.05 }}
          >
            <Badge
              variant={isOtherSelected ? "default" : "outline"}
              className={`cursor-pointer text-sm py-2 px-4 transition-all ${
                isOtherSelected 
                  ? "bg-secondary hover:bg-secondary/90" 
                  : "hover:bg-secondary/10 border-dashed"
              }`}
              onClick={() => toggleSegment(OTHER_SEGMENT_ID)}
            >
              {isOtherSelected ? <Check className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
              Outro
            </Badge>
          </motion.div>
        </div>

        {/* Campo de texto para categoria personalizada */}
        {showCustomInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4"
          >
            <Input
              placeholder="Digite sua categoria (ex: Marmitas Fitness)"
              value={data.customSegment}
              onChange={(e) => handleCustomSegmentChange(e.target.value)}
              className="max-w-md"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Descreva brevemente o tipo do seu negócio
            </p>
          </motion.div>
        )}

        {(data.selectedSegments.length > 0 || data.customSegment) && (() => {
          const regularSelected = data.selectedSegments.filter(id => id !== OTHER_SEGMENT_ID);
          const primaryId = regularSelected[0];
          const primary = primaryId ? segments.find(s => s.id === primaryId) : null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1"
            >
              <p className="text-sm">
                <span className="font-medium text-primary">{regularSelected.length}</span>
                {" "}categoria{regularSelected.length !== 1 ? "s" : ""} selecionada{regularSelected.length !== 1 ? "s" : ""}
                {data.customSegment && (
                  <span className="text-muted-foreground"> + "{data.customSegment}"</span>
                )}
              </p>
              {primary && (
                <p className="text-xs text-muted-foreground">
                  Principal: <span className="font-medium text-foreground">{primary.name}</span>
                  {regularSelected.length > 1 && " (primeira selecionada — clique em outra para trocar)"}
                </p>
              )}
            </motion.div>
          );
        })()}
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={isNextDisabled()}
          className="flex-1"
        >
          Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
