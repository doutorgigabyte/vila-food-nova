import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/contexts/AdminAccessContext";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GoogleMap from "@/components/maps/GoogleMap";
import { 
  MapPin, 
  Loader2, 
  Save, 
  Navigation, 
  Target,
  Truck,
  Gift,
  DollarSign,
  CheckCircle2
} from "lucide-react";

interface EstablishmentData {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  max_delivery_radius_km: number | null;
  delivery_base_fee: number | null;
  delivery_fee_per_km: number | null;
  free_delivery_radius_km: number | null;
}

const ServiceAreaManagementNew = () => {
  const { user } = useAuth();
  const { slug } = useParams();
  const { accessingEstablishmentId } = useAdminAccess();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [establishment, setEstablishment] = useState<EstablishmentData | null>(null);

  // Form state - unified
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [maxRadius, setMaxRadius] = useState(10);
  const [baseFee, setBaseFee] = useState(5);
  const [feePerKm, setFeePerKm] = useState(1.5);
  const [freeDeliveryRadius, setFreeDeliveryRadius] = useState(0);
  const [enableFreeDelivery, setEnableFreeDelivery] = useState(false);

  // Step tracking for wizard-style UX
  const [currentStep, setCurrentStep] = useState<'location' | 'radius' | 'fees'>('location');

  useEffect(() => {
    if (user || accessingEstablishmentId || slug) fetchEstablishment();
  }, [user, accessingEstablishmentId, slug]);

  const fetchEstablishment = async () => {
    setLoading(true);
    let query = supabase
      .from("establishments")
      .select("id, name, slug, latitude, longitude, address, max_delivery_radius_km, delivery_base_fee, delivery_fee_per_km, free_delivery_radius_km");
    
    if (accessingEstablishmentId) {
      query = query.eq("id", accessingEstablishmentId);
    } else if (slug) {
      query = query.eq("slug", slug);
    } else {
      query = query.eq("owner_id", user?.id);
    }
    
    const { data, error } = await query.maybeSingle();

    if (error) {
      toast.error("Erro ao carregar dados do estabelecimento");
    } else if (data) {
      setEstablishment(data);
      setAddress(data.address || "");
      setLatitude(data.latitude);
      setLongitude(data.longitude);
      setMaxRadius(data.max_delivery_radius_km || 10);
      setBaseFee(data.delivery_base_fee || 5);
      setFeePerKm(data.delivery_fee_per_km || 1.5);
      setFreeDeliveryRadius(data.free_delivery_radius_km || 0);
      setEnableFreeDelivery((data.free_delivery_radius_km || 0) > 0);
      
      // Determine initial step
      if (data.latitude && data.longitude) {
        setCurrentStep('radius');
      }
    }
    setLoading(false);
  };

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada pelo navegador");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        // Reverse geocode to get address
        if (window.google) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
            if (status === "OK" && results?.[0]) {
              setAddress(results[0].formatted_address);
            }
            setGettingLocation(false);
            toast.success("Localização obtida com sucesso!");
            setCurrentStep('radius');
          });
        } else {
          setGettingLocation(false);
          toast.success("Localização obtida!");
          setCurrentStep('radius');
        }
      },
      (error) => {
        setGettingLocation(false);
        toast.error("Erro ao obter localização: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleAddressSearch = useCallback(async () => {
    if (!address.trim()) {
      toast.error("Digite um endereço");
      return;
    }

    if (!window.google) {
      toast.error("Google Maps não carregado");
      return;
    }

    setGettingLocation(true);
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address }, (results: any, status: string) => {
      setGettingLocation(false);
      if (status === "OK" && results?.[0]) {
        const location = results[0].geometry.location;
        setLatitude(location.lat());
        setLongitude(location.lng());
        setAddress(results[0].formatted_address);
        toast.success("Endereço encontrado!");
        setCurrentStep('radius');
      } else {
        toast.error("Endereço não encontrado. Tente ser mais específico.");
      }
    });
  }, [address]);

  const handleSave = async () => {
    if (!establishment) return;

    setSaving(true);
    const { error } = await supabase
      .from("establishments")
      .update({
        latitude,
        longitude,
        address,
        max_delivery_radius_km: maxRadius,
        delivery_base_fee: baseFee,
        delivery_fee_per_km: feePerKm,
        free_delivery_radius_km: enableFreeDelivery ? freeDeliveryRadius : 0,
      })
      .eq("id", establishment.id);

    if (error) {
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Configurações salvas com sucesso!");
    }
    setSaving(false);
  };

  const hasLocation = latitude !== null && longitude !== null;

  const getRadiusPolygon = (center: { lat: number; lng: number }, radiusKm: number) => {
    const points: { lat: number; lng: number }[] = [];
    const numPoints = 64;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const dx = radiusKm * Math.cos(angle) / 111.32;
      const dy = radiusKm * Math.sin(angle) / (111.32 * Math.cos(center.lat * Math.PI / 180));
      points.push({ lat: center.lat + dx, lng: center.lng + dy });
    }
    
    return points;
  };

  if (loading) {
    return (
      <DashboardLayout title="Área de Atendimento" establishment={establishment}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!establishment) {
    return (
      <DashboardLayout title="Área de Atendimento" establishment={null}>
        <Card className="max-w-md mx-auto">
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum estabelecimento encontrado</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const center = hasLocation 
    ? { lat: latitude!, lng: longitude! } 
    : { lat: -8.7614, lng: -35.1087 };

  return (
    <DashboardLayout title="Área de Atendimento" establishment={establishment}>
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          {['location', 'radius', 'fees'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep === step 
                    ? 'bg-primary text-primary-foreground' 
                    : hasLocation && (step === 'location' || (step === 'radius' && currentStep === 'fees'))
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {hasLocation && step === 'location' ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
              </div>
              {index < 2 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  (step === 'location' && hasLocation) || (step === 'radius' && currentStep === 'fees')
                    ? 'bg-green-500'
                    : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Form */}
          <div className="space-y-4">
            {/* Step 1: Location */}
            <Card className={currentStep === 'location' ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5" />
                  1. Localização do Estabelecimento
                </CardTitle>
                <CardDescription>
                  Defina onde fica seu estabelecimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço completo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua, número, bairro, cidade"
                      className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleAddressSearch}
                    disabled={gettingLocation || !address.trim()}
                    className="flex-1 min-w-[140px]"
                  >
                    {gettingLocation ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4 mr-2" />
                    )}
                    Buscar Endereço
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                    className="flex-1 min-w-[140px]"
                  >
                    {gettingLocation ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4 mr-2" />
                    )}
                    Usar GPS
                  </Button>
                </div>

                {hasLocation && (
                  <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Localização definida: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Delivery Radius */}
            <Card className={currentStep === 'radius' ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="w-5 h-5" />
                  2. Raio de Entrega
                </CardTitle>
                <CardDescription>
                  Defina até onde você entrega
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Raio máximo de entrega</Label>
                    <span className="text-lg font-semibold text-primary">{maxRadius} km</span>
                  </div>
                  <Slider
                    value={[maxRadius]}
                    onValueChange={([value]) => setMaxRadius(value)}
                    min={1}
                    max={50}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-green-600" />
                      <Label htmlFor="freeDelivery">Frete grátis</Label>
                    </div>
                    <Switch
                      id="freeDelivery"
                      checked={enableFreeDelivery}
                      onCheckedChange={setEnableFreeDelivery}
                    />
                  </div>
                  
                  {enableFreeDelivery && (
                    <div className="space-y-3 pl-6">
                      <div className="flex justify-between items-center">
                        <Label>Raio de frete grátis</Label>
                        <span className="font-semibold text-green-600">{freeDeliveryRadius} km</span>
                      </div>
                      <Slider
                        value={[freeDeliveryRadius]}
                        onValueChange={([value]) => setFreeDeliveryRadius(value)}
                        min={0}
                        max={maxRadius}
                        step={0.5}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Delivery Fees */}
            <Card className={currentStep === 'fees' ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5" />
                  3. Taxas de Entrega
                </CardTitle>
                <CardDescription>
                  Configure como cobrar pela entrega
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseFee">Taxa base (R$)</Label>
                    <Input
                      id="baseFee"
                      type="number"
                      step="0.50"
                      value={baseFee}
                      onChange={(e) => setBaseFee(parseFloat(e.target.value) || 0)}
                      placeholder="5.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feePerKm">Taxa por km (R$)</Label>
                    <Input
                      id="feePerKm"
                      type="number"
                      step="0.10"
                      value={feePerKm}
                      onChange={(e) => setFeePerKm(parseFloat(e.target.value) || 0)}
                      placeholder="1.50"
                    />
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                  <p className="font-medium">Exemplo de cálculo:</p>
                  <p className="text-muted-foreground">
                    Entrega a 5km = R$ {baseFee.toFixed(2)} + (5 × R$ {feePerKm.toFixed(2)}) = <strong>R$ {(baseFee + 5 * feePerKm).toFixed(2)}</strong>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving || !hasLocation} className="w-full" size="lg">
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>

          {/* Right Column - Map Preview */}
          <Card className="lg:sticky lg:top-4 h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5" />
                Visualização
              </CardTitle>
              <CardDescription>
                Veja a área de entrega no mapa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleMap
                center={center}
                zoom={hasLocation ? 13 : 10}
                polygon={hasLocation ? getRadiusPolygon(center, maxRadius) : undefined}
                markers={hasLocation ? [{
                  id: 'establishment',
                  position: center,
                  title: establishment.name,
                }] : []}
                className="w-full h-[400px] rounded-lg overflow-hidden"
              />
              
              {hasLocation && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {enableFreeDelivery && freeDeliveryRadius > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full text-sm">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Frete grátis: {freeDeliveryRadius}km
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-sm">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    Área de entrega: {maxRadius}km
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ServiceAreaManagementNew;
