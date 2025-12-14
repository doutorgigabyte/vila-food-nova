import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  ArrowRight, 
  Store, 
  Phone, 
  MessageCircle,
  Building2,
  Check,
  X,
  MapPin,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVilas } from "@/hooks/useVilas";
import { OnboardingData } from "../OnboardingWizard";
import { ImageUpload } from "@/components/ImageUpload";
import { CepAutocomplete, CepData } from "@/components/address/CepAutocomplete";
import { useServiceCities, validateServiceCity } from "@/hooks/useActiveRegion";

interface BasicDataStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const BasicDataStep = ({ data, updateData, onNext, onBack }: BasicDataStepProps) => {
  const { vilas } = useVilas();
  const { cities: serviceCities, loading: loadingCities } = useServiceCities();
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [cep, setCep] = useState("");
  const [cityValidation, setCityValidation] = useState<{ valid: boolean; message: string } | null>(null);
  const [addressData, setAddressData] = useState({
    address: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    if (!data.subdomain || data.subdomain.length < 3) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      const { data: existing } = await supabase
        .from("establishments")
        .select("id")
        .eq("slug", data.subdomain)
        .maybeSingle();
      
      setSlugAvailable(!existing);
      setCheckingSlug(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [data.subdomain]);

  const handleSubdomainChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    updateData({ subdomain: sanitized });
  };

  const handleCepFound = (cepData: CepData) => {
    setAddressData({
      address: cepData.address,
      neighborhood: cepData.neighborhood,
      city: cepData.city,
      state: cepData.state,
    });
    
    // Validate if city is in service area
    if (serviceCities.length > 0) {
      const matchedCity = validateServiceCity(cepData.city, serviceCities);
      if (matchedCity) {
        setCityValidation({ 
          valid: true, 
          message: `${matchedCity.name} está na nossa área de atendimento!` 
        });
      } else {
        const availableCities = serviceCities.map(c => c.name).join(", ");
        setCityValidation({ 
          valid: false, 
          message: `No momento, atendemos apenas: ${availableCities}. Em breve expandiremos para sua região!` 
        });
      }
    }
  };

  const isValid = 
    data.establishmentName.trim().length >= 3 &&
    data.phone.length >= 10 &&
    data.subdomain.length >= 3 &&
    slugAvailable === true &&
    (cityValidation === null || cityValidation.valid);
    data.establishmentName.trim().length >= 3 &&
    data.phone.length >= 10 &&
    data.subdomain.length >= 3 &&
    slugAvailable === true;

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-5">
        <div className="flex flex-col items-center">
          <Label className="mb-3 text-center">Logo do estabelecimento (opcional)</Label>
          <ImageUpload currentImage={data.logoUrl} onUpload={(url) => updateData({ logoUrl: url })} bucket="establishments" aspectRatio="square" className="w-24 h-24" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nome do estabelecimento *</Label>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="name" placeholder="Ex: Pizzaria do João" className="pl-10" value={data.establishmentName} onChange={(e) => updateData({ establishmentName: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="phone" placeholder="(00) 00000-0000" className="pl-10" value={data.phone} onChange={(e) => updateData({ phone: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="whatsapp" placeholder="(00) 00000-0000" className="pl-10" value={data.whatsapp} onChange={(e) => updateData({ whatsapp: e.target.value })} />
          </div>
        </div>

        <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="w-4 h-4 text-primary" />
            Endereço do Estabelecimento
          </div>
          <CepAutocomplete value={cep} onChange={setCep} onAddressFound={handleCepFound} />
          {addressData.address && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Endereço</Label>
                <Input value={addressData.address} readOnly className="bg-muted/50 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Bairro</Label>
                <Input value={addressData.neighborhood} readOnly className="bg-muted/50 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Cidade/Estado</Label>
                <Input value={`${addressData.city}/${addressData.state}`} readOnly className="bg-muted/50 h-9 text-sm" />
              </div>
              {cityValidation && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className={`col-span-2 flex items-start gap-2 text-sm p-3 rounded-lg ${
                    cityValidation.valid 
                      ? "bg-green-500/10 text-green-600 border border-green-500/20" 
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                >
                  {cityValidation.valid ? (
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{cityValidation.message}</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subdomain">Link da sua loja *</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="subdomain" placeholder="minhaloja" className="pl-10 pr-36" value={data.subdomain} onChange={(e) => handleSubdomainChange(e.target.value)} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">.vilafood.delivery</span>
          </div>
          {data.subdomain.length >= 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center gap-2 text-sm ${checkingSlug ? "text-muted-foreground" : slugAvailable ? "text-green-600" : "text-destructive"}`}>
              {checkingSlug ? <span>Verificando...</span> : slugAvailable ? <><Check className="w-4 h-4" /><span>Disponível!</span></> : <><X className="w-4 h-4" /><span>Já em uso</span></>}
            </motion.div>
          )}
        </div>

        {vilas.length > 0 && (
          <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center space-x-3">
              <Checkbox id="belongs-to-vila" checked={data.belongsToVila} onCheckedChange={(checked) => updateData({ belongsToVila: checked as boolean, vilaId: checked ? data.vilaId : "" })} />
              <div className="space-y-1">
                <Label htmlFor="belongs-to-vila" className="cursor-pointer font-medium">Faz parte de uma Vila?</Label>
                <p className="text-xs text-muted-foreground">Vilas são locais com múltiplos estabelecimentos</p>
              </div>
            </div>
            {data.belongsToVila && (
              <Select value={data.vilaId} onValueChange={(val) => updateData({ vilaId: val })}>
                <SelectTrigger><SelectValue placeholder="Escolha a vila" /></SelectTrigger>
                <SelectContent>{vilas.map((vila) => <SelectItem key={vila.id} value={vila.id}>{vila.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
        )}
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1"><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
        <Button onClick={onNext} disabled={!isValid} className="flex-1">Continuar<ArrowRight className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
};