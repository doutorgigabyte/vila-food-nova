import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  ArrowRight, 
  SkipForward,
  Package,
  DollarSign,
  FileText,
  Tag,
  Lightbulb
} from "lucide-react";
import { OnboardingData } from "../OnboardingWizard";
import { ImageUpload } from "@/components/ImageUpload";

interface FirstProductStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export const FirstProductStep = ({ data, updateData, onNext, onBack, onSkip }: FirstProductStepProps) => {
  const [productData, setProductData] = useState({
    name: data.firstProduct?.name || "",
    description: data.firstProduct?.description || "",
    price: data.firstProduct?.price || 0,
    imageUrl: data.firstProduct?.imageUrl || null,
    categoryName: data.firstProduct?.categoryName || "Produtos",
  });

  const handleChange = (field: string, value: any) => {
    setProductData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (productData.name && productData.price > 0) {
      updateData({ 
        firstProduct: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          imageUrl: productData.imageUrl,
          categoryName: productData.categoryName,
        }
      });
      onNext();
    }
  };

  const handleSkip = () => {
    updateData({ firstProduct: null });
    onSkip();
  };

  const isValid = productData.name.trim().length >= 2 && productData.price > 0;

  return (
    <div className="space-y-6">
      {/* Tip Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 rounded-lg bg-accent/10 border border-accent/30"
      >
        <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-accent-foreground">Dica rápida!</p>
          <p className="text-muted-foreground">
            Cadastrar um produto agora ajuda você a ver como sua loja vai ficar. 
            Você pode pular esta etapa e adicionar depois.
          </p>
        </div>
      </motion.div>

      <Card className="p-6 space-y-5">
        {/* Product Image */}
        <div className="flex flex-col items-center">
          <Label className="mb-3 text-center">Foto do produto (opcional)</Label>
          <ImageUpload
            currentImage={productData.imageUrl}
            onUpload={(url) => handleChange("imageUrl", url)}
            bucket="products"
            aspectRatio="square"
            className="w-32 h-32"
            establishmentId="onboarding"
          />
        </div>

        {/* Product Name */}
        <div className="space-y-2">
          <Label htmlFor="product-name">Nome do produto *</Label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="product-name"
              placeholder="Ex: Pizza Margherita"
              className="pl-10"
              value={productData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="product-description">Descrição (opcional)</Label>
          <Textarea
            id="product-description"
            placeholder="Descreva os ingredientes ou detalhes do produto..."
            className="min-h-[80px]"
            value={productData.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="product-price">Preço *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              R$
            </span>
            <Input
              id="product-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              className="pl-10"
              value={productData.price || ""}
              onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Category Name */}
        <div className="space-y-2">
          <Label htmlFor="category-name">Categoria do produto</Label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="category-name"
              placeholder="Ex: Pizzas, Bebidas, Promoções..."
              className="pl-10"
              value={productData.categoryName}
              onChange={(e) => handleChange("categoryName", e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Esta categoria será criada automaticamente para organizar seus produtos
          </p>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={!isValid}
            className="flex-1"
          >
            Continuar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={handleSkip}
          className="text-muted-foreground"
        >
          <SkipForward className="w-4 h-4 mr-2" />
          Pular esta etapa
        </Button>
      </div>
    </div>
  );
};
