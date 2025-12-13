import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation, Check, Loader2 } from "lucide-react";

interface AddressData {
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  reference: string;
  lat?: number;
  lng?: number;
  formatted_address?: string;
}

interface AddressAutocompleteProps {
  value: AddressData;
  onChange: (data: AddressData) => void;
  establishmentLat?: number;
  establishmentLng?: number;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyAIl_jZHOswjHwpXwHpDlnyacOUcRYXVco";

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  establishmentLat = -8.7576, 
  establishmentLng = -35.1031 
}: AddressAutocompleteProps) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) {
      setIsMapLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Initialize map when loaded and showMap is true
  useEffect(() => {
    if (!isMapLoaded || !showMap || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      const initialLat = value.lat || establishmentLat;
      const initialLng = value.lng || establishmentLng;

      const map = new Map(mapRef.current!, {
        center: { lat: initialLat, lng: initialLng },
        zoom: 16,
        mapId: "delivery-map",
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
      });

      // Create draggable marker
      const markerContent = document.createElement("div");
      markerContent.innerHTML = `
        <div class="relative">
          <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rotate-45"></div>
        </div>
      `;

      const marker = new AdvancedMarkerElement({
        map,
        position: { lat: initialLat, lng: initialLng },
        content: markerContent,
        gmpDraggable: true,
      });

      marker.addListener("dragend", () => {
        const position = marker.position as google.maps.LatLngLiteral;
        reverseGeocode(position.lat, position.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Initialize services
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      placesServiceRef.current = new google.maps.places.PlacesService(map);
      geocoderRef.current = new google.maps.Geocoder();
    };

    initMap();
  }, [isMapLoaded, showMap, value.lat, value.lng, establishmentLat, establishmentLng]);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    try {
      const response = await geocoderRef.current.geocode({ location: { lat, lng } });
      if (response.results[0]) {
        const result = response.results[0];
        const components = result.address_components;
        
        const getComponent = (type: string) => 
          components.find(c => c.types.includes(type))?.long_name || "";

        onChange({
          ...value,
          address: `${getComponent("route")}`,
          number: getComponent("street_number"),
          neighborhood: getComponent("sublocality_level_1") || getComponent("sublocality") || getComponent("neighborhood"),
          city: getComponent("administrative_area_level_2") || getComponent("locality"),
          state: getComponent("administrative_area_level_1"),
          cep: getComponent("postal_code").replace("-", ""),
          lat,
          lng,
          formatted_address: result.formatted_address,
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  }, [onChange, value]);

  // Handle search input
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (!autocompleteServiceRef.current || query.length < 3) {
      setSuggestions([]);
      return;
    }

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: "br" },
        types: ["address"],
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      }
    );
  }, []);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((placeId: string, description: string) => {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      { placeId, fields: ["geometry", "address_components", "formatted_address"] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const lat = place.geometry?.location?.lat() || 0;
          const lng = place.geometry?.location?.lng() || 0;
          const components = place.address_components || [];

          const getComponent = (type: string) =>
            components.find(c => c.types.includes(type))?.long_name || "";

          onChange({
            ...value,
            address: getComponent("route"),
            number: getComponent("street_number"),
            neighborhood: getComponent("sublocality_level_1") || getComponent("sublocality") || getComponent("neighborhood"),
            city: getComponent("administrative_area_level_2") || getComponent("locality"),
            state: getComponent("administrative_area_level_1"),
            cep: getComponent("postal_code").replace("-", ""),
            lat,
            lng,
            formatted_address: place.formatted_address,
          });

          // Update map position
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.panTo({ lat, lng });
            markerRef.current.position = { lat, lng };
          }

          setSearchQuery(description);
          setSuggestions([]);
          setShowMap(true);
        }
      }
    );
  }, [onChange, value]);

  // Get current location via GPS
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada pelo navegador");
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        reverseGeocode(lat, lng);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.panTo({ lat, lng });
          markerRef.current.position = { lat, lng };
        }

        setShowMap(true);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Não foi possível obter sua localização. Verifique as permissões.");
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [reverseGeocode]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="space-y-2">
        <Label>Buscar endereço</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            placeholder="Digite seu endereço..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
          
          {/* Suggestions dropdown - now inside relative container */}
          {suggestions.length > 0 && (
            <Card className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto shadow-lg">
              <CardContent className="p-0">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion.place_id, suggestion.description)}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-0 flex items-start gap-3"
                  >
                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">{suggestion.description}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* GPS Button */}
      <Button
        type="button"
        variant="outline"
        onClick={getCurrentLocation}
        disabled={isLoadingLocation}
        className="w-full"
      >
        {isLoadingLocation ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Navigation className="w-4 h-4 mr-2" />
        )}
        Usar minha localização atual
      </Button>

      {/* Map */}
      {showMap && (
        <div className="space-y-3">
          <div 
            ref={mapRef} 
            className="w-full h-64 rounded-lg border border-border overflow-hidden"
          />
          <p className="text-xs text-muted-foreground text-center">
            Arraste o marcador para ajustar a localização exata
          </p>
        </div>
      )}

      {/* Confirmed Address */}
      {value.formatted_address && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Endereço confirmado
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {value.formatted_address}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual fields for complement and number adjustment */}
      {value.address && (
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={value.address}
              onChange={(e) => onChange({ ...value, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="number">Número *</Label>
            <Input
              id="number"
              placeholder="123"
              value={value.number}
              onChange={(e) => onChange({ ...value, number: e.target.value })}
            />
          </div>
        </div>
      )}

      {value.address && (
        <>
          <div className="space-y-2">
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              placeholder="Apto, Bloco, Casa..."
              value={value.complement}
              onChange={(e) => onChange({ ...value, complement: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={value.neighborhood}
                onChange={(e) => onChange({ ...value, neighborhood: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Referência</Label>
              <Input
                id="reference"
                placeholder="Próximo a..."
                value={value.reference}
                onChange={(e) => onChange({ ...value, reference: e.target.value })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AddressAutocomplete;
