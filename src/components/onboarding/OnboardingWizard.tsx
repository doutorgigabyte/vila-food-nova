import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { BusinessTypeStep } from "./steps/BusinessTypeStep";
import { SubcategoriesStep } from "./steps/SubcategoriesStep";
import { BasicDataStep } from "./steps/BasicDataStep";
import { FirstProductStep } from "./steps/FirstProductStep";
import { FinalConfigStep } from "./steps/FinalConfigStep";
import { OnboardingComplete } from "./OnboardingComplete";

export interface OnboardingData {
  // Step 1 - Business Type
  mainCategoryId: string;
  mainCategoryName: string;
  
  // Step 2 - Subcategories
  selectedSegments: string[];
  
  // Step 3 - Basic Data
  establishmentName: string;
  phone: string;
  whatsapp: string;
  subdomain: string;
  logoUrl: string | null;
  belongsToVila: boolean;
  vilaId: string;
  
  // Step 4 - First Product (optional)
  firstProduct: {
    name: string;
    description: string;
    price: number;
    imageUrl: string | null;
    categoryName: string;
  } | null;
  
  // Step 5 - Final Config
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  acceptsTable: boolean;
  operatingHours: Record<string, { open: string; close: string; isOpen: boolean }>;
}

const initialData: OnboardingData = {
  mainCategoryId: "",
  mainCategoryName: "",
  selectedSegments: [],
  establishmentName: "",
  phone: "",
  whatsapp: "",
  subdomain: "",
  logoUrl: null,
  belongsToVila: false,
  vilaId: "",
  firstProduct: null,
  acceptsDelivery: true,
  acceptsPickup: true,
  acceptsTable: false,
  operatingHours: {
    monday: { open: "08:00", close: "18:00", isOpen: true },
    tuesday: { open: "08:00", close: "18:00", isOpen: true },
    wednesday: { open: "08:00", close: "18:00", isOpen: true },
    thursday: { open: "08:00", close: "18:00", isOpen: true },
    friday: { open: "08:00", close: "18:00", isOpen: true },
    saturday: { open: "08:00", close: "14:00", isOpen: true },
    sunday: { open: "08:00", close: "14:00", isOpen: false },
  },
};

const steps = [
  { id: 1, title: "Tipo de Negócio", description: "Qual o seu segmento?" },
  { id: 2, title: "Categorias", description: "O que você vende?" },
  { id: 3, title: "Dados Básicos", description: "Informações do negócio" },
  { id: 4, title: "Primeiro Produto", description: "Cadastre seu primeiro item" },
  { id: 5, title: "Configurações", description: "Últimos ajustes" },
];

export const OnboardingWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string>("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      toast.error("Você precisa estar logado para criar um estabelecimento");
      navigate("/auth");
    }
  }, [user, navigate]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipStep = () => {
    if (currentStep === 4) {
      // Skip first product step
      nextStep();
    }
  };

  const handleComplete = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create establishment
      const { data: establishment, error: establishmentError } = await supabase
        .from("establishments")
        .insert({
          name: data.establishmentName,
          slug: data.subdomain,
          phone: data.phone,
          whatsapp: data.whatsapp,
          logo_url: data.logoUrl,
          owner_id: user.id,
          segment_id: data.selectedSegments[0] || null,
          vila_id: data.belongsToVila && data.vilaId ? data.vilaId : null,
          accepts_delivery: data.acceptsDelivery,
          accepts_pickup: data.acceptsPickup,
          accepts_table: data.acceptsTable,
          operating_hours: data.operatingHours,
          status: "active",
          is_open: true,
        })
        .select()
        .single();

      if (establishmentError) throw establishmentError;

      // Create default category for the establishment
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .insert({
          establishment_id: establishment.id,
          name: data.firstProduct?.categoryName || "Produtos",
          is_active: true,
          sort_order: 0,
        })
        .select()
        .single();

      if (categoryError) throw categoryError;

      // Create first product if provided
      if (data.firstProduct) {
        const { error: productError } = await supabase
          .from("products")
          .insert({
            establishment_id: establishment.id,
            category_id: category.id,
            name: data.firstProduct.name,
            description: data.firstProduct.description,
            price: data.firstProduct.price,
            image_url: data.firstProduct.imageUrl,
            is_active: true,
          });

        if (productError) throw productError;
      }

      // Add user to establishment_users
      const { error: userError } = await supabase
        .from("establishment_users")
        .insert({
          establishment_id: establishment.id,
          user_id: user.id,
          role: "manager",
          is_active: true,
        });

      if (userError) throw userError;

      setCreatedSlug(establishment.slug);
      setIsCompleted(true);
      toast.success("🎉 Estabelecimento criado com sucesso!");

    } catch (error: any) {
      console.error("Error creating establishment:", error);
      toast.error(error.message || "Erro ao criar estabelecimento");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return <OnboardingComplete slug={createdSlug} establishmentName={data.establishmentName} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-6 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Cadastro Rápido</span>
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Crie sua loja em <span className="text-primary">minutos</span>
          </h1>
          <p className="text-muted-foreground">
            Siga os passos abaixo e comece a vender hoje mesmo
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: currentStep === step.id ? 1.1 : 1,
                    backgroundColor: 
                      currentStep > step.id 
                        ? "hsl(var(--primary))" 
                        : currentStep === step.id 
                          ? "hsl(var(--primary))" 
                          : "hsl(var(--muted))",
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    currentStep >= step.id 
                      ? "text-primary-foreground" 
                      : "text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </motion.div>
                {index < steps.length - 1 && (
                  <div className="hidden sm:block w-8 md:w-16 h-1 mx-1">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: currentStep > step.id ? 1 : 0 }}
                      className="h-full bg-primary origin-left rounded-full"
                      transition={{ duration: 0.3 }}
                    />
                    <div className="h-full bg-muted -mt-1 rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Current step info */}
          <div className="text-center">
            <p className="font-semibold text-lg">{steps[currentStep - 1].title}</p>
            <p className="text-sm text-muted-foreground">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && (
              <BusinessTypeStep 
                data={data} 
                updateData={updateData} 
                onNext={nextStep} 
              />
            )}
            {currentStep === 2 && (
              <SubcategoriesStep 
                data={data} 
                updateData={updateData} 
                onNext={nextStep} 
                onBack={prevStep}
              />
            )}
            {currentStep === 3 && (
              <BasicDataStep 
                data={data} 
                updateData={updateData} 
                onNext={nextStep} 
                onBack={prevStep}
              />
            )}
            {currentStep === 4 && (
              <FirstProductStep 
                data={data} 
                updateData={updateData} 
                onNext={nextStep} 
                onBack={prevStep}
                onSkip={skipStep}
              />
            )}
            {currentStep === 5 && (
              <FinalConfigStep 
                data={data} 
                updateData={updateData} 
                onComplete={handleComplete}
                onBack={prevStep}
                isSubmitting={isSubmitting}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
