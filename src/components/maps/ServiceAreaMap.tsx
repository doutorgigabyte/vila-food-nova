import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import GoogleMap from './GoogleMap';
import { 
  MapPin, 
  Circle, 
  Pencil, 
  Trash2, 
  Save, 
  Plus,
  Navigation,
  Loader2,
  Building2,
  Zap,
  Bike,
  Gift
} from 'lucide-react';

type DeliveryMode = 'free' | 'minimum' | 'standard' | 'turbo';
type ZoneType = 'polygon' | 'radius' | 'neighborhood' | 'city';
type CalculationMode = 'distance' | 'fixed' | 'zone';

interface DeliveryZone {
  id?: string;
  name: string;
  type: ZoneType;
  delivery_mode: DeliveryMode;
  coordinates: { lat: number; lng: number }[];
  radius_km?: number;
  neighborhoods: string[];
  zip_codes: string[];
  fee: number;
  min_time: number;
  max_time: number;
  turbo_min_time: number;
  turbo_max_time: number;
  is_active: boolean;
}

interface EstablishmentDeliveryConfig {
  free_delivery_radius_km: number;
  minimum_delivery_fee: number;
  minimum_delivery_radius_km: number;
  delivery_base_fee: number;
  delivery_fee_per_km: number;
  max_delivery_radius_km: number;
  turbo_fee: number;
  turbo_radius_km: number;
  delivery_calculation_mode: CalculationMode;
}

interface City {
  id: string;
  name: string;
  slug: string | null;
}

interface ServiceAreaMapProps {
  establishmentId: string;
  establishmentLocation: { lat: number; lng: number };
  onSave?: () => void;
}

const DELIVERY_MODE_CONFIG = {
  free: { label: 'Grátis', icon: Gift, color: 'text-green-600', bgColor: 'bg-green-500/10' },
  minimum: { label: 'Taxa Mínima', icon: Circle, color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
  standard: { label: 'Padrão', icon: Bike, color: 'text-primary', bgColor: 'bg-primary/10' },
  turbo: { label: 'Turbo', icon: Zap, color: 'text-orange-600', bgColor: 'bg-orange-500/10' },
};

const ServiceAreaMap = ({
  establishmentId,
  establishmentLocation,
  onSave,
}: ServiceAreaMapProps) => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'zones'>('config');
  const [zoneTypeTab, setZoneTypeTab] = useState<'polygon' | 'radius' | 'city'>('radius');

  // Establishment config
  const [config, setConfig] = useState<EstablishmentDeliveryConfig>({
    free_delivery_radius_km: 0,
    minimum_delivery_fee: 5,
    minimum_delivery_radius_km: 1,
    delivery_base_fee: 5,
    delivery_fee_per_km: 1.5,
    max_delivery_radius_km: 10,
    turbo_fee: 15,
    turbo_radius_km: 15,
    delivery_calculation_mode: 'distance',
  });

  // Cities list
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [loadingCities, setLoadingCities] = useState(false);

  // Form state for new/edit zone
  const [zoneName, setZoneName] = useState('');
  const [zoneFee, setZoneFee] = useState('');
  const [zoneMinTime, setZoneMinTime] = useState('20');
  const [zoneMaxTime, setZoneMaxTime] = useState('45');
  const [zoneRadius, setZoneRadius] = useState('5');
  const [zoneCoords, setZoneCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [zoneDeliveryMode, setZoneDeliveryMode] = useState<DeliveryMode>('standard');

  useEffect(() => {
    fetchData();
  }, [establishmentId]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchConfig(), fetchZones(), fetchCities()]);
    setLoading(false);
  };

  const fetchConfig = async () => {
    const { data, error } = await supabase
      .from('establishments')
      .select(`
        free_delivery_radius_km,
        minimum_delivery_fee,
        minimum_delivery_radius_km,
        delivery_base_fee,
        delivery_fee_per_km,
        max_delivery_radius_km,
        turbo_fee,
        turbo_radius_km,
        delivery_calculation_mode
      `)
      .eq('id', establishmentId)
      .single();

    if (!error && data) {
      setConfig({
        free_delivery_radius_km: data.free_delivery_radius_km || 0,
        minimum_delivery_fee: data.minimum_delivery_fee || 5,
        minimum_delivery_radius_km: data.minimum_delivery_radius_km || 1,
        delivery_base_fee: data.delivery_base_fee || 5,
        delivery_fee_per_km: data.delivery_fee_per_km || 1.5,
        max_delivery_radius_km: data.max_delivery_radius_km || 10,
        turbo_fee: data.turbo_fee || 15,
        turbo_radius_km: data.turbo_radius_km || 15,
        delivery_calculation_mode: (data.delivery_calculation_mode || 'distance') as CalculationMode,
      });
    }
  };

  const fetchCities = async () => {
    setLoadingCities(true);
    const { data, error } = await supabase
      .from('cities')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setCities(data);
    }
    setLoadingCities(false);
  };

  const fetchZones = async () => {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('name');

    if (error) {
      toast.error('Erro ao carregar zonas de entrega');
    } else {
      const formattedZones = (data || []).map(zone => ({
        id: zone.id,
        name: zone.name,
        type: zone.type as ZoneType,
        delivery_mode: (zone.delivery_mode || 'standard') as DeliveryMode,
        coordinates: (zone.coordinates as { lat: number; lng: number }[]) || [],
        radius_km: zone.radius_km || undefined,
        neighborhoods: zone.neighborhoods || [],
        zip_codes: zone.zip_codes || [],
        fee: zone.fee,
        min_time: zone.min_time || 20,
        max_time: zone.max_time || 45,
        turbo_min_time: zone.turbo_min_time || 10,
        turbo_max_time: zone.turbo_max_time || 20,
        is_active: zone.is_active ?? true,
      }));
      setZones(formattedZones);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('establishments')
      .update(config)
      .eq('id', establishmentId);

    if (error) {
      toast.error('Erro ao salvar configurações');
    } else {
      toast.success('Configurações salvas!');
      onSave?.();
    }
    setSaving(false);
  };

  const handlePolygonChange = (coords: { lat: number; lng: number }[]) => {
    setZoneCoords(coords);
  };

  const generateCityPolygon = async (cityId: string): Promise<{ lat: number; lng: number }[]> => {
    const city = cities.find(c => c.id === cityId);
    if (!city) return [];
    return getRadiusPolygon(establishmentLocation, 20);
  };

  const handleSaveZone = async () => {
    if (!zoneName) {
      toast.error('Nome da zona é obrigatório');
      return;
    }

    if (zoneTypeTab === 'polygon' && zoneCoords.length < 3) {
      toast.error('Desenhe uma área no mapa com pelo menos 3 pontos');
      return;
    }

    if (zoneTypeTab === 'city' && !selectedCityId) {
      toast.error('Selecione uma cidade');
      return;
    }

    setSaving(true);

    let coordinates = zoneCoords;
    if (zoneTypeTab === 'city') {
      coordinates = await generateCityPolygon(selectedCityId);
    }

    const zoneData = {
      establishment_id: establishmentId,
      name: zoneName,
      type: zoneTypeTab,
      delivery_mode: zoneDeliveryMode,
      coordinates: zoneTypeTab === 'radius' ? [] : coordinates,
      radius_km: zoneTypeTab === 'radius' ? parseFloat(zoneRadius) : zoneTypeTab === 'city' ? 20 : null,
      fee: parseFloat(zoneFee) || 0,
      min_time: parseInt(zoneMinTime) || 20,
      max_time: parseInt(zoneMaxTime) || 45,
      is_active: true,
    };

    try {
      if (selectedZone?.id) {
        const { error } = await supabase
          .from('delivery_zones')
          .update(zoneData)
          .eq('id', selectedZone.id);
        if (error) throw error;
        toast.success('Zona atualizada!');
      } else {
        const { error } = await supabase
          .from('delivery_zones')
          .insert(zoneData);
        if (error) throw error;
        toast.success('Zona criada!');
      }

      resetForm();
      fetchZones();
      onSave?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar zona');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('Deseja excluir esta zona de entrega?')) return;

    const { error } = await supabase
      .from('delivery_zones')
      .delete()
      .eq('id', zoneId);

    if (error) {
      toast.error('Erro ao excluir zona');
    } else {
      toast.success('Zona excluída!');
      fetchZones();
    }
  };

  const handleEditZone = (zone: DeliveryZone) => {
    setSelectedZone(zone);
    setZoneName(zone.name);
    setZoneFee(zone.fee.toString());
    setZoneMinTime(zone.min_time.toString());
    setZoneMaxTime(zone.max_time.toString());
    setZoneCoords(zone.coordinates);
    setZoneTypeTab(zone.type === 'radius' ? 'radius' : 'polygon');
    setZoneDeliveryMode(zone.delivery_mode);
    if (zone.radius_km) {
      setZoneRadius(zone.radius_km.toString());
    }
    setActiveTab('zones');
  };

  const resetForm = () => {
    setSelectedZone(null);
    setZoneName('');
    setZoneFee('');
    setZoneMinTime('20');
    setZoneMaxTime('45');
    setZoneCoords([]);
    setZoneRadius('5');
    setSelectedCityId('');
    setZoneDeliveryMode('standard');
    setIsDrawing(false);
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    const city = cities.find(c => c.id === cityId);
    if (city) {
      setZoneName(city.name);
      const cityPolygon = getRadiusPolygon(establishmentLocation, 20);
      setZoneCoords(cityPolygon);
    }
  };

  const getRadiusPolygon = (center: { lat: number; lng: number }, radiusKm: number): { lat: number; lng: number }[] => {
    const points: { lat: number; lng: number }[] = [];
    const numPoints = 32;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const dx = radiusKm * Math.cos(angle) / 111.32;
      const dy = radiusKm * Math.sin(angle) / (111.32 * Math.cos(center.lat * Math.PI / 180));
      points.push({
        lat: center.lat + dx,
        lng: center.lng + dy,
      });
    }
    
    return points;
  };

  // Get all polygons for display
  const getDisplayPolygons = () => {
    const polygons: { coords: { lat: number; lng: number }[]; color: string }[] = [];
    
    // Free zone (green)
    if (config.free_delivery_radius_km > 0) {
      polygons.push({
        coords: getRadiusPolygon(establishmentLocation, config.free_delivery_radius_km),
        color: '#22c55e'
      });
    }
    
    // Minimum zone (blue)
    if (config.minimum_delivery_radius_km > 0) {
      polygons.push({
        coords: getRadiusPolygon(establishmentLocation, config.minimum_delivery_radius_km),
        color: '#3b82f6'
      });
    }
    
    // Standard zone (primary)
    if (config.max_delivery_radius_km > 0) {
      polygons.push({
        coords: getRadiusPolygon(establishmentLocation, config.max_delivery_radius_km),
        color: '#6366f1'
      });
    }
    
    // Turbo zone (orange)
    if (config.turbo_radius_km > 0) {
      polygons.push({
        coords: getRadiusPolygon(establishmentLocation, config.turbo_radius_km),
        color: '#f97316'
      });
    }

    return polygons;
  };

  // Display polygon for current editing
  const displayPolygon = (() => {
    if (zoneCoords.length > 0) return zoneCoords;
    if (zoneTypeTab === 'radius') {
      return getRadiusPolygon(establishmentLocation, parseFloat(zoneRadius) || 5);
    }
    return undefined;
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'config' | 'zones')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">Configuração Geral</TabsTrigger>
          <TabsTrigger value="zones">Zonas Personalizadas</TabsTrigger>
        </TabsList>

        {/* General Configuration Tab */}
        <TabsContent value="config" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Map Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Visualização das Zonas
                </CardTitle>
                <CardDescription>
                  Visualize as áreas de entrega configuradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GoogleMap
                  center={establishmentLocation}
                  zoom={13}
                  polygon={getDisplayPolygons()[getDisplayPolygons().length - 1]?.coords}
                  markers={[
                    {
                      id: 'establishment',
                      position: establishmentLocation,
                      title: 'Seu estabelecimento',
                    },
                  ]}
                  className="w-full h-[350px]"
                />
                
                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {config.free_delivery_radius_km > 0 && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      <Gift className="w-3 h-3 mr-1" />
                      Grátis: {config.free_delivery_radius_km}km
                    </Badge>
                  )}
                  {config.minimum_delivery_radius_km > 0 && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                      <Circle className="w-3 h-3 mr-1" />
                      Mínimo: {config.minimum_delivery_radius_km}km
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    <Bike className="w-3 h-3 mr-1" />
                    Padrão: {config.max_delivery_radius_km}km
                  </Badge>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                    <Zap className="w-3 h-3 mr-1" />
                    Turbo: {config.turbo_radius_km}km
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Configuration Form */}
            <div className="space-y-4">
              {/* Free Delivery Zone */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Gift className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Zona de Entrega Grátis</h3>
                      <p className="text-sm text-muted-foreground">Clientes neste raio não pagam taxa</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Raio de entrega grátis: {config.free_delivery_radius_km} km</Label>
                    <Slider
                      value={[config.free_delivery_radius_km]}
                      onValueChange={([v]) => setConfig(c => ({ ...c, free_delivery_radius_km: v }))}
                      min={0}
                      max={5}
                      step={0.5}
                      className="py-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Minimum Fee Zone */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Circle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Zona de Taxa Mínima</h3>
                      <p className="text-sm text-muted-foreground">Taxa fixa para clientes próximos</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Raio: {config.minimum_delivery_radius_km} km</Label>
                      <Slider
                        value={[config.minimum_delivery_radius_km]}
                        onValueChange={([v]) => setConfig(c => ({ ...c, minimum_delivery_radius_km: v }))}
                        min={0}
                        max={10}
                        step={0.5}
                        className="py-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taxa mínima (R$)</Label>
                      <Input
                        type="number"
                        step="0.50"
                        value={config.minimum_delivery_fee}
                        onChange={(e) => setConfig(c => ({ ...c, minimum_delivery_fee: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Standard Zone */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Bike className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Zona de Entrega Padrão</h3>
                      <p className="text-sm text-muted-foreground">Cálculo por distância ou taxa fixa</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Raio máximo: {config.max_delivery_radius_km} km</Label>
                    <Slider
                      value={[config.max_delivery_radius_km]}
                      onValueChange={([v]) => setConfig(c => ({ ...c, max_delivery_radius_km: v }))}
                      min={1}
                      max={30}
                      step={1}
                      className="py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modo de cálculo</Label>
                    <Select 
                      value={config.delivery_calculation_mode} 
                      onValueChange={(v) => setConfig(c => ({ ...c, delivery_calculation_mode: v as CalculationMode }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distance">Por distância (base + km)</SelectItem>
                        <SelectItem value="fixed">Taxa fixa</SelectItem>
                        <SelectItem value="zone">Por zona personalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Taxa base (R$)</Label>
                      <Input
                        type="number"
                        step="0.50"
                        value={config.delivery_base_fee}
                        onChange={(e) => setConfig(c => ({ ...c, delivery_base_fee: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Por km (R$)</Label>
                      <Input
                        type="number"
                        step="0.10"
                        value={config.delivery_fee_per_km}
                        onChange={(e) => setConfig(c => ({ ...c, delivery_fee_per_km: parseFloat(e.target.value) || 0 }))}
                        disabled={config.delivery_calculation_mode === 'fixed'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Turbo Zone */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Zap className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Zona Turbo (Express)</h3>
                      <p className="text-sm text-muted-foreground">Entrega rápida com taxa premium</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Raio turbo: {config.turbo_radius_km} km</Label>
                      <Slider
                        value={[config.turbo_radius_km]}
                        onValueChange={([v]) => setConfig(c => ({ ...c, turbo_radius_km: v }))}
                        min={1}
                        max={50}
                        step={1}
                        className="py-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taxa turbo (R$)</Label>
                      <Input
                        type="number"
                        step="0.50"
                        value={config.turbo_fee}
                        onChange={(e) => setConfig(c => ({ ...c, turbo_fee: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSaveConfig} disabled={saving} className="w-full">
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Configurações
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Custom Zones Tab */}
        <TabsContent value="zones" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Área de Atendimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GoogleMap
                    center={establishmentLocation}
                    zoom={14}
                    polygon={displayPolygon}
                    onPolygonChange={handlePolygonChange}
                    editable={isDrawing}
                    drawingMode={isDrawing && zoneTypeTab === 'polygon'}
                    markers={[
                      {
                        id: 'establishment',
                        position: establishmentLocation,
                        title: 'Seu estabelecimento',
                      },
                    ]}
                    className="w-full h-[400px]"
                  />

                  <div className="mt-4 flex gap-2">
                    {zoneTypeTab === 'polygon' && (
                      <Button
                        variant={isDrawing ? 'default' : 'outline'}
                        onClick={() => setIsDrawing(!isDrawing)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        {isDrawing ? 'Finalizando...' : 'Desenhar Área'}
                      </Button>
                    )}
                    {zoneCoords.length > 0 && (
                      <Button variant="outline" onClick={() => setZoneCoords([])}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Limpar Desenho
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Zone Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedZone ? 'Editar Zona' : 'Nova Zona Personalizada'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Delivery Mode Selector */}
                  <div className="space-y-2">
                    <Label>Tipo de zona</Label>
                    <Select value={zoneDeliveryMode} onValueChange={(v) => setZoneDeliveryMode(v as DeliveryMode)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DELIVERY_MODE_CONFIG).map(([mode, cfg]) => (
                          <SelectItem key={mode} value={mode}>
                            <div className="flex items-center gap-2">
                              <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                              {cfg.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Tabs value={zoneTypeTab} onValueChange={(v) => setZoneTypeTab(v as 'polygon' | 'radius' | 'city')}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="radius" className="gap-1">
                        <Circle className="w-3 h-3" />
                        Raio
                      </TabsTrigger>
                      <TabsTrigger value="polygon" className="gap-1">
                        <Pencil className="w-3 h-3" />
                        Polígono
                      </TabsTrigger>
                      <TabsTrigger value="city" className="gap-1">
                        <Building2 className="w-3 h-3" />
                        Cidade
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="radius" className="mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="radius">Raio de entrega (km)</Label>
                        <Input
                          id="radius"
                          type="number"
                          step="0.5"
                          value={zoneRadius}
                          onChange={(e) => setZoneRadius(e.target.value)}
                          placeholder="5"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="polygon" className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        Clique em "Desenhar Área" e desenhe o polígono no mapa.
                        {zoneCoords.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {zoneCoords.length} pontos
                          </Badge>
                        )}
                      </p>
                    </TabsContent>

                    <TabsContent value="city" className="mt-4 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">Selecione a cidade</Label>
                        <Select value={selectedCityId} onValueChange={handleCityChange}>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingCities ? "Carregando..." : "Selecione uma cidade"} />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.id}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="space-y-2">
                    <Label htmlFor="zoneName">Nome da zona *</Label>
                    <Input
                      id="zoneName"
                      value={zoneName}
                      onChange={(e) => setZoneName(e.target.value)}
                      placeholder="Ex: Centro, Zona Norte"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zoneFee">Taxa de entrega (R$)</Label>
                    <Input
                      id="zoneFee"
                      type="number"
                      step="0.50"
                      value={zoneFee}
                      onChange={(e) => setZoneFee(e.target.value)}
                      placeholder={zoneDeliveryMode === 'free' ? '0.00' : '5.00'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minTime">Tempo mín. (min)</Label>
                      <Input
                        id="minTime"
                        type="number"
                        value={zoneMinTime}
                        onChange={(e) => setZoneMinTime(e.target.value)}
                        placeholder="20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxTime">Tempo máx. (min)</Label>
                      <Input
                        id="maxTime"
                        type="number"
                        value={zoneMaxTime}
                        onChange={(e) => setZoneMaxTime(e.target.value)}
                        placeholder="45"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveZone} disabled={saving} className="flex-1">
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {selectedZone ? 'Atualizar' : 'Salvar'}
                    </Button>
                    {selectedZone && (
                      <Button variant="outline" onClick={resetForm}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Zones List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Zonas Cadastradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {zones.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma zona personalizada cadastrada
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {zones.map((zone) => {
                    const modeConfig = DELIVERY_MODE_CONFIG[zone.delivery_mode];
                    const ModeIcon = modeConfig.icon;
                    
                    return (
                      <Card key={zone.id} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-md ${modeConfig.bgColor}`}>
                                <ModeIcon className={`w-4 h-4 ${modeConfig.color}`} />
                              </div>
                              <span className="font-medium">{zone.name}</span>
                            </div>
                            <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                              {zone.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Tipo: {modeConfig.label}</p>
                            <p>Taxa: {zone.fee === 0 ? 'Grátis' : `R$ ${zone.fee.toFixed(2)}`}</p>
                            <p>Tempo: {zone.min_time}-{zone.max_time} min</p>
                            {zone.type === 'radius' && zone.radius_km && (
                              <p>Raio: {zone.radius_km} km</p>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditZone(zone)}
                              className="flex-1"
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteZone(zone.id!)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceAreaMap;
