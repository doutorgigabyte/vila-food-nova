import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Rocket,
  Truck,
  Store,
  UtensilsCrossed,
  Clock,
  Loader2,
  PartyPopper
} from "lucide-react";
import { OnboardingData } from "../OnboardingWizard";

interface FinalConfigStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onComplete: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const dayLabels: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

export const FinalConfigStep = ({ data, updateData, onComplete, onBack, isSubmitting }: FinalConfigStepProps) => {
  const toggleDay = (day: string) => {
    const current = data.operatingHours[day];
    updateData({
      operatingHours: {
        ...data.operatingHours,
        [day]: { ...current, isOpen: !current.isOpen }
      }
    });
  };

  const updateHours = (day: string, field: "open" | "close", value: string) => {
    const current = data.operatingHours[day];
    updateData({
      operatingHours: {
        ...data.operatingHours,
        [day]: { ...current, [field]: value }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Order Types */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Como seus clientes podem pedir?</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Delivery</p>
                <p className="text-xs text-muted-foreground">Entrega no endereço</p>
              </div>
            </div>
            <Switch
              checked={data.acceptsDelivery}
              onCheckedChange={(checked) => updateData({ acceptsDelivery: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Retirada</p>
                <p className="text-xs text-muted-foreground">Cliente busca no local</p>
              </div>
            </div>
            <Switch
              checked={data.acceptsPickup}
              onCheckedChange={(checked) => updateData({ acceptsPickup: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Mesa/Local</p>
                <p className="text-xs text-muted-foreground">Consumo no estabelecimento</p>
              </div>
            </div>
            <Switch
              checked={data.acceptsTable}
              onCheckedChange={(checked) => updateData({ acceptsTable: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Operating Hours */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Horário de funcionamento</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Você pode ajustar isso depois nas configurações
        </p>

        <div className="space-y-3">
          {Object.entries(dayLabels).map(([day, label]) => {
            const hours = data.operatingHours[day];
            
            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  hours.isOpen ? "bg-muted/50" : "bg-muted/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={hours.isOpen}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  <span className={`font-medium w-20 ${!hours.isOpen && "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>

                {hours.isOpen && (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => updateHours(day, "open", e.target.value)}
                      className="bg-background border rounded px-2 py-1 text-sm"
                    />
                    <span className="text-muted-foreground">às</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => updateHours(day, "close", e.target.value)}
                      className="bg-background border rounded px-2 py-1 text-sm"
                    />
                  </div>
                )}

                {!hours.isOpen && (
                  <span className="text-sm text-muted-foreground">Fechado</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <PartyPopper className="w-6 h-6 text-primary flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Tudo pronto!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Criar minha loja" para finalizar. Você poderá 
              ajustar todas as configurações depois no painel.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={onComplete} 
          disabled={isSubmitting}
          className="flex-1 bg-primary hover:bg-primary/90"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4 mr-2" />
              Criar minha loja
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
