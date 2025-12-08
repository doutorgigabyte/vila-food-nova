import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDeliveryCalculation } from '@/hooks/useDeliveryCalculation';
import GoogleMap from '@/components/maps/GoogleMap';
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  Check, 
  X, 
  Clock,
  Truck,
  AlertCircle
} from 'lucide-react';

interface DeliveryCalculatorProps {
  establishmentId: string;
  establishmentLocation?: { lat: number; lng: number };
  onDeliveryCalculated?: (result: {
    canDeliver: boolean;
    fee: number;
    distance: number;
    minTime: number;
    maxTime: number;
  }) => void;
}

const DeliveryCalculator = ({
  establishmentId,
  establishmentLocation,
  onDeliveryCalculated,
}: DeliveryCalculatorProps) => {
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);

  const { 
    latitude, 
    longitude, 
    loading: geoLoading, 
    error: geoError, 
    getCurrentPosition 
  } = useGeolocation();

  const {
    result,
    loading: calcLoading,
    error: calcError,
    calculateDelivery,
    calculateLocal,
    reset,
  } = useDeliveryCalculation({ establishment_id: establishmentId });

  // Update customer location from geolocation
  useEffect(() => {
    if (latitude && longitude) {
      setCustomerLocation({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  // Calculate delivery when customer location is set
  useEffect(() => {
    if (customerLocation && establishmentId) {
      handleCalculate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerLocation, establishmentId]);

  // Notify parent of result
  useEffect(() => {
    if (result && onDeliveryCalculated) {
      onDeliveryCalculated({
        canDeliver: result.can_deliver,
        fee: result.delivery_fee,
        distance: result.distance_km,
        minTime: result.estimated_min_time,
        maxTime: result.estimated_max_time,
      });
    }
  }, [result, onDeliveryCalculated]);

  const handleGetLocation = () => {
    getCurrentPosition();
  };

  const handleCepSearch = async () => {
    if (cep.length !== 8) {
      return;
    }

    try {
      // First, get address from CEP
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade}, ${data.uf}`;
      setAddress(fullAddress);

      // Then geocode the address
      if (window.google) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: fullAddress }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            setCustomerLocation({
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng(),
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching CEP:', error);
    }
  };

  const handleCalculate = async () => {
    if (!customerLocation) return;

    try {
      await calculateDelivery(customerLocation.lat, customerLocation.lng, cep);
    } catch {
      // Fallback to local calculation
      await calculateLocal(customerLocation.lat, customerLocation.lng);
    }
  };

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    setCustomerLocation(coords);
    setShowMap(false);
  };

  const loading = geoLoading || calcLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Calcular Entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CEP Input */}
        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <div className="flex gap-2">
            <Input
              id="cep"
              placeholder="00000000"
              value={cep}
              onChange={(e) => setCep(e.target.value.replace(/\D/g, ''))}
              maxLength={8}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={handleCepSearch}
              disabled={cep.length !== 8 || loading}
            >
              Buscar
            </Button>
          </div>
        </div>

        {/* Address Display */}
        {address && (
          <div className="text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 inline mr-1" />
            {address}
          </div>
        )}

        {/* Location Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGetLocation}
            disabled={loading}
          >
            {geoLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 mr-2" />
            )}
            Usar Minha Localização
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMap(!showMap)}
          >
            <MapPin className="w-4 h-4 mr-2" />
            {showMap ? 'Ocultar Mapa' : 'Escolher no Mapa'}
          </Button>
        </div>

        {/* Map */}
        {showMap && (
          <GoogleMap
            center={establishmentLocation || customerLocation || { lat: -8.7614, lng: -35.1087 }}
            zoom={14}
            showUserLocation={!!customerLocation}
            userLocation={customerLocation}
            onMapClick={handleMapClick}
            markers={establishmentLocation ? [{
              id: 'establishment',
              position: establishmentLocation,
              title: 'Estabelecimento',
            }] : []}
            className="w-full h-64"
          />
        )}

        {/* Errors */}
        {(geoError || calcError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {geoError || calcError}
            </AlertDescription>
          </Alert>
        )}

        {/* Result */}
        {result && (
          <div className={`p-4 rounded-lg border ${
            result.can_deliver 
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.can_deliver ? (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <span className={`font-medium ${
                result.can_deliver 
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {result.can_deliver ? 'Entrega disponível!' : 'Fora da área de entrega'}
              </span>
            </div>

            {result.can_deliver && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de entrega</p>
                  <p className="text-lg font-bold text-primary">
                    R$ {result.delivery_fee.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distância</p>
                  <p className="text-lg font-bold">
                    {result.distance_km.toFixed(1)} km
                  </p>
                </div>
                <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    Tempo estimado: {result.estimated_min_time}-{result.estimated_max_time} min
                  </span>
                </div>
                {result.zone_name && (
                  <div className="col-span-2">
                    <Badge variant="secondary">{result.zone_name}</Badge>
                  </div>
                )}
              </div>
            )}

            {!result.can_deliver && (
              <p className="text-sm text-muted-foreground mt-2">
                {result.message}
              </p>
            )}
          </div>
        )}

        {/* Calculate Button */}
        {customerLocation && !result && (
          <Button onClick={handleCalculate} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Truck className="w-4 h-4 mr-2" />
            )}
            Calcular Taxa de Entrega
          </Button>
        )}

        {/* Reset */}
        {result && (
          <Button variant="outline" onClick={reset} className="w-full">
            Calcular Novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryCalculator;
