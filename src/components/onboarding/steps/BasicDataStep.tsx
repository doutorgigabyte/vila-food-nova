import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  AlertTriangle,
  Mail,
  FileText,
  Image,
  Instagram,
  Home,
  Users,
  HelpCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVilas } from "@/hooks/useVilas";
import { OnboardingData } from "../OnboardingWizard";
import { ImageUpload } from "@/components/ImageUpload";
import { CepAutocomplete, CepData } from "@/components/address/CepAutocomplete";
import { useServiceCities, validateServiceCity } from "@/hooks/useActiveRegion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BasicDataStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Formatação de CNPJ/CPF
const formatCnpjCpf = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 11) {
    // CPF: 000.000.000-00
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    // CNPJ: 00.000.000/0000-00
    return numbers
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
};

// Formatação de telefone
const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return numbers
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

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

  const handlePhoneChange = (value: string) => {
    updateData({ phone: formatPhone(value) });
  };

  const handleWhatsAppChange = (value: string) => {
    updateData({ whatsapp: formatPhone(value) });
  };

  const handleCnpjCpfChange = (value: string) => {
    updateData({ cnpjCpf: formatCnpjCpf(value) });
  };

  const isValid = 
    data.establishmentName.trim().length >= 3 &&
    data.phone.replace(/\D/g, "").length >= 10 &&
    data.subdomain.length >= 3 &&
    slugAvailable === true &&
    (cityValidation === null || cityValidation.valid);

  return (
    <div className="space-y-6">
      {/* Seção 1: Imagens */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Identidade Visual</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Logo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>Logo do estabelecimento</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Imagem quadrada, mínimo 360x360px</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex justify-center">
              <ImageUpload 
                currentImage={data.logoUrl} 
                onUpload={(url) => updateData({ logoUrl: url })} 
                bucket="establishments" 
                aspectRatio="square" 
                className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors" 
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">PNG ou JPG, máx. 2MB</p>
          </div>

          {/* Banner */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>Banner da loja (opcional)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Imagem 16:9, mínimo 1200x675px</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <ImageUpload 
              currentImage={data.bannerUrl} 
              onUpload={(url) => updateData({ bannerUrl: url })} 
              bucket="establishments" 
              aspectRatio="video" 
              className="w-full h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors" 
            />
            <p className="text-xs text-muted-foreground text-center">Aparece no topo do seu cardápio digital</p>
          </div>
        </div>
      </Card>

      {/* Seção 2: Identificação */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Store className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Dados do Estabelecimento</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do estabelecimento *</Label>
            <Input 
              id="name" 
              placeholder="Ex: Pizzaria do João" 
              value={data.establishmentName} 
              onChange={(e) => updateData({ establishmentName: e.target.value })} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpjCpf">CNPJ ou CPF</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                id="cnpjCpf" 
                placeholder="00.000.000/0000-00" 
                className="pl-10" 
                value={data.cnpjCpf} 
                onChange={(e) => handleCnpjCpfChange(e.target.value)}
                maxLength={18}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição do estabelecimento</Label>
          <Textarea 
            id="description" 
            placeholder="Conte um pouco sobre seu negócio, especialidades, diferenciais..." 
            value={data.description} 
            onChange={(e) => updateData({ description: e.target.value })}
            className="min-h-[80px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{data.description?.length || 0}/500</p>
        </div>
      </Card>

      {/* Seção 3: Contato */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Phone className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Contato</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                id="phone" 
                placeholder="(00) 00000-0000" 
                className="pl-10" 
                value={data.phone} 
                onChange={(e) => handlePhoneChange(e.target.value)}
                maxLength={15}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                id="whatsapp" 
                placeholder="(00) 00000-0000" 
                className="pl-10" 
                value={data.whatsapp} 
                onChange={(e) => handleWhatsAppChange(e.target.value)}
                maxLength={15}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email comercial</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email"
                placeholder="contato@seurestaurante.com" 
                className="pl-10" 
                value={data.email} 
                onChange={(e) => updateData({ email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                id="instagram" 
                placeholder="@seurestaurante" 
                className="pl-10" 
                value={data.instagramUrl} 
                onChange={(e) => updateData({ instagramUrl: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Seção 4: Localização */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Localização</h3>
        </div>

        <CepAutocomplete value={cep} onChange={setCep} onAddressFound={handleCepFound} />
        
        {addressData.address && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label className="text-xs">Endereço</Label>
                <Input value={addressData.address} readOnly className="bg-muted/50" />
              </div>
              <div>
                <Label className="text-xs">Número *</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Nº" 
                    className="pl-10" 
                    value={data.addressNumber} 
                    onChange={(e) => updateData({ addressNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Complemento</Label>
                <Input 
                  placeholder="Sala, bloco, apto..." 
                  value={data.addressComplement} 
                  onChange={(e) => updateData({ addressComplement: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Bairro</Label>
                <Input value={addressData.neighborhood} readOnly className="bg-muted/50" />
              </div>
              <div>
                <Label className="text-xs">Cidade/Estado</Label>
                <Input value={`${addressData.city}/${addressData.state}`} readOnly className="bg-muted/50" />
              </div>
            </div>

            {cityValidation && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={`flex items-start gap-2 text-sm p-3 rounded-lg ${
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
      </Card>

      {/* Seção 5: Link da Loja */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Link da sua loja</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subdomain">Escolha seu endereço web *</Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input 
                id="subdomain" 
                placeholder="minhaloja" 
                value={data.subdomain} 
                onChange={(e) => handleSubdomainChange(e.target.value)} 
              />
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">.vilafood.delivery</span>
          </div>
          {data.subdomain.length >= 3 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className={`flex items-center gap-2 text-sm ${
                checkingSlug ? "text-muted-foreground" : slugAvailable ? "text-green-600" : "text-destructive"
              }`}
            >
              {checkingSlug ? (
                <span>Verificando...</span>
              ) : slugAvailable ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Link disponível!</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  <span>Este link já está em uso</span>
                </>
              )}
            </motion.div>
          )}
          {data.subdomain && slugAvailable && (
            <p className="text-xs text-muted-foreground">
              Seu cardápio ficará em: <span className="font-medium text-primary">{data.subdomain}.vilafood.delivery</span>
            </p>
          )}
        </div>
      </Card>

      {/* Seção 6: Vilas */}
      {vilas.length > 0 && (
        <Card className="p-6 space-y-4 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Faz parte de uma Vila?</h3>
          </div>

          <div className="rounded-lg bg-background/80 p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Uma <strong className="text-foreground">Vila</strong> é um espaço físico que reúne vários estabelecimentos no mesmo local:
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">🍔</span>
                <span><strong>Food Parks</strong> - Praças de alimentação ao ar livre</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🏢</span>
                <span><strong>Galerias</strong> - Centros comerciais</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🌳</span>
                <span><strong>Praças</strong> - Áreas públicas com quiosques</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🏪</span>
                <span><strong>Food Courts</strong> - Praças de shopping</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Se seu negócio está dentro de um desses locais, selecione abaixo. Isso ajuda clientes a encontrarem você!
            </p>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <Checkbox 
              id="belongs-to-vila" 
              checked={data.belongsToVila} 
              onCheckedChange={(checked) => updateData({ belongsToVila: checked as boolean, vilaId: checked ? data.vilaId : "" })} 
            />
            <Label htmlFor="belongs-to-vila" className="cursor-pointer">
              Sim, meu estabelecimento faz parte de uma Vila
            </Label>
          </div>

          {data.belongsToVila && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <Select value={data.vilaId} onValueChange={(val) => updateData({ vilaId: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha a Vila" />
                </SelectTrigger>
                <SelectContent>
                  {vilas.map((vila) => (
                    <SelectItem key={vila.id} value={vila.id}>{vila.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!isValid} className="flex-1">
          Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};