import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAccess } from "@/contexts/AdminAccessContext";
import { toast } from "sonner";
import ServiceAreaMap from "@/components/maps/ServiceAreaMap";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { MapPin, Loader2, Save, Navigation } from "lucide-react";

const ServiceAreaManagement = () => {
  const { user } = useAuth();
  const { slug } = useParams();
  const { accessingEstablishmentId } = useAdminAccess();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [establishment, setEstablishment] = useState<{
    id: string;
    name: string;
    slug: string;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    max_delivery_radius_km: number | null;
    delivery_base_fee: number | null;
    delivery_fee_per_km: number | null;
  } | null>(null);

  // Form state
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");
  const [maxRadius, setMaxRadius] = useState("10");
  const [baseFee, setBaseFee] = useState("5");
  const [feePerKm, setFeePerKm] = useState("1.5");

  useEffect(() => {
    if (user || accessingEstablishmentId || slug) fetchEstablishment();
  }, [user, accessingEstablishmentId, slug]);

  const fetchEstablishment = async () => {
    setLoading(true);
    let query = supabase
      .from("establishments")
      .select("id, name, slug, latitude, longitude, address, max_delivery_radius_km, delivery_base_fee, delivery_fee_per_km");
    
    // Priority: Admin context > slug > owner_id
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
      setLatitude(data.latitude?.toString() || "");
      setLongitude(data.longitude?.toString() || "");
      setAddress(data.address || "");
      setMaxRadius(data.max_delivery_radius_km?.toString() || "10");
      setBaseFee(data.delivery_base_fee?.toString() || "5");
      setFeePerKm(data.delivery_fee_per_km?.toString() || "1.5");
    }
    setLoading(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada pelo navegador");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        toast.success("Localização obtida!");
      },
      (error) => {
        toast.error("Erro ao obter localização: " + error.message);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleGeocodeAddress = async () => {
    if (!address) {
      toast.error("Digite um endereço");
      return;
    }

    try {
      if (!window.google) {
        toast.error("Google Maps não carregado");
        return;
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results: any, status: string) => {
        if (status === "OK" && results && results[0]) {
          setLatitude(results[0].geometry.location.lat().toString());
          setLongitude(results[0].geometry.location.lng().toString());
          toast.success("Coordenadas encontradas!");
        } else {
          toast.error("Endereço não encontrado");
        }
      });
    } catch (error) {
      toast.error("Erro ao buscar coordenadas do endereço");
    }
  };

  const handleSaveLocation = async () => {
    if (!establishment) return;

    setSaving(true);
    const { error } = await supabase
      .from("establishments")
      .update({
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address,
        max_delivery_radius_km: parseFloat(maxRadius) || 10,
        delivery_base_fee: parseFloat(baseFee) || 5,
        delivery_fee_per_km: parseFloat(feePerKm) || 1.5,
      })
      .eq("id", establishment.id);

    if (error) {
      toast.error("Erro ao salvar localização");
    } else {
      toast.success("Localização salva!");
      fetchEstablishment();
    }
    setSaving(false);
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

  const hasLocation = latitude && longitude;
  const establishmentLocation = hasLocation
    ? { lat: parseFloat(latitude), lng: parseFloat(longitude) }
    : { lat: -8.7614, lng: -35.1087 }; // Default to Tamandaré

  return (
    <DashboardLayout title="Área de Atendimento" establishment={establishment}>
      <div className="space-y-6">
        {/* Location Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Localização do Estabelecimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <div className="flex gap-2">
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleGeocodeAddress}>
                  Buscar Coordenadas
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-8.7614"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-35.1087"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxRadius">Raio máximo (km)</Label>
                <Input
                  id="maxRadius"
                  type="number"
                  step="0.5"
                  value={maxRadius}
                  onChange={(e) => setMaxRadius(e.target.value)}
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseFee">Taxa base (R$)</Label>
                <Input
                  id="baseFee"
                  type="number"
                  step="0.50"
                  value={baseFee}
                  onChange={(e) => setBaseFee(e.target.value)}
                  placeholder="5.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feePerKm">Taxa/km (R$)</Label>
                <Input
                  id="feePerKm"
                  type="number"
                  step="0.10"
                  value={feePerKm}
                  onChange={(e) => setFeePerKm(e.target.value)}
                  placeholder="1.50"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleGetCurrentLocation}>
                <MapPin className="w-4 h-4 mr-2" />
                Usar Minha Localização
              </Button>
              <Button onClick={handleSaveLocation} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Localização
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Service Area Map */}
        {hasLocation ? (
          <ServiceAreaMap
            establishmentId={establishment.id}
            establishmentLocation={establishmentLocation}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Configure a localização do estabelecimento para definir as áreas de atendimento
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ServiceAreaManagement;
