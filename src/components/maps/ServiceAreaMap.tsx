import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Building2
} from 'lucide-react';

interface DeliveryZone {
  id?: string;
  name: string;
  type: 'polygon' | 'radius' | 'neighborhood' | 'city';
  coordinates: { lat: number; lng: number }[];
  radius_km?: number;
  neighborhoods: string[];
  zip_codes: string[];
  fee: number;
  min_time: number;
  max_time: number;
  is_active: boolean;
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
  const [activeTab, setActiveTab] = useState<'polygon' | 'radius' | 'city'>('polygon');

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

  useEffect(() => {
    fetchZones();
    fetchCities();
  }, [establishmentId]);

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
    setLoading(true);
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
        type: zone.type as 'polygon' | 'radius' | 'neighborhood',
        coordinates: (zone.coordinates as { lat: number; lng: number }[]) || [],
        radius_km: zone.radius_km || undefined,
        neighborhoods: zone.neighborhoods || [],
        zip_codes: zone.zip_codes || [],
        fee: zone.fee,
        min_time: zone.min_time || 20,
        max_time: zone.max_time || 45,
        is_active: zone.is_active ?? true,
      }));
      setZones(formattedZones);
    }
    setLoading(false);
  };

  const handlePolygonChange = (coords: { lat: number; lng: number }[]) => {
    setZoneCoords(coords);
  };

  // Generate city polygon approximation (20km radius circle around establishment)
  const generateCityPolygon = async (cityId: string): Promise<{ lat: number; lng: number }[]> => {
    const city = cities.find(c => c.id === cityId);
    if (!city) return [];
    
    // Use establishment location as center, 20km radius for city coverage
    return getRadiusPolygon(establishmentLocation, 20);
  };

  const handleSaveZone = async () => {
    if (!zoneName) {
      toast.error('Nome da zona é obrigatório');
      return;
    }

    if (activeTab === 'polygon' && zoneCoords.length < 3) {
      toast.error('Desenhe uma área no mapa com pelo menos 3 pontos');
      return;
    }

    if (activeTab === 'city' && !selectedCityId) {
      toast.error('Selecione uma cidade');
      return;
    }

    setSaving(true);

    let coordinates = zoneCoords;
    
    // For city type, generate a large radius polygon
    if (activeTab === 'city') {
      coordinates = await generateCityPolygon(selectedCityId);
    }

    const zoneData = {
      establishment_id: establishmentId,
      name: zoneName,
      type: activeTab,
      coordinates: activeTab === 'radius' ? [] : coordinates,
      radius_km: activeTab === 'radius' ? parseFloat(zoneRadius) : activeTab === 'city' ? 20 : null,
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
    setActiveTab(zone.type === 'radius' ? 'radius' : 'polygon');
    if (zone.radius_km) {
      setZoneRadius(zone.radius_km.toString());
    }
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
    setIsDrawing(false);
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    const city = cities.find(c => c.id === cityId);
    if (city) {
      setZoneName(city.name);
      // Generate 20km radius around establishment for city coverage
      const cityPolygon = getRadiusPolygon(establishmentLocation, 20);
      setZoneCoords(cityPolygon);
    }
  };

  // Generate radius polygon for display
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
  const displayPolygon = (() => {
    if (zoneCoords.length > 0) return zoneCoords;
    if (activeTab === 'radius') {
      return getRadiusPolygon(establishmentLocation, parseFloat(zoneRadius) || 5);
    }
    return undefined;
  })();

  return (
    <div className="space-y-6">
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
                drawingMode={isDrawing && activeTab === 'polygon'}
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
                {activeTab === 'polygon' && (
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
                {selectedZone ? 'Editar Zona' : 'Nova Zona de Entrega'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'polygon' | 'radius' | 'city')}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="polygon" className="gap-1">
                    <Pencil className="w-3 h-3" />
                    Polígono
                  </TabsTrigger>
                  <TabsTrigger value="radius" className="gap-1">
                    <Circle className="w-3 h-3" />
                    Raio
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
                  <p className="text-xs text-muted-foreground">
                    Ao selecionar uma cidade, será criada uma área de atendimento de 20km de raio.
                  </p>
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
                  placeholder="5.00"
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : zones.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma zona de entrega cadastrada
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {zones.map((zone) => (
                <Card key={zone.id} className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {zone.type === 'radius' ? (
                          <Circle className="w-4 h-4 text-primary" />
                        ) : zone.type === 'city' ? (
                          <Building2 className="w-4 h-4 text-primary" />
                        ) : (
                          <MapPin className="w-4 h-4 text-primary" />
                        )}
                        <span className="font-medium">{zone.name}</span>
                      </div>
                      <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                        {zone.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Taxa: R$ {zone.fee.toFixed(2)}</p>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceAreaMap;
