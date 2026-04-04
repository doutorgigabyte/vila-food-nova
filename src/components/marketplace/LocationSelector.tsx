import { useState, useEffect } from "react";
import { GOOGLE_MAPS_API_KEY } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MapPin, 
  ChevronDown, 
  Navigation, 
  Home, 
  Building, 
  Heart,
  Plus,
  Star,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSavedAddresses, SavedAddress } from "@/hooks/useSavedAddresses";
import { useActiveRegion, useServiceCities, isWithinServiceArea } from "@/hooks/useActiveRegion";
import { toast } from "sonner";

interface LocationSelectorProps {
  onLocationChange?: (location: { address: string; lat?: number; lng?: number; cityId?: string; inServiceArea?: boolean }) => void;
}

const labelIcons: Record<string, typeof Home> = {
  "Casa": Home,
  "Trabalho": Building,
  "Favorito": Heart,
};

export const LocationSelector = ({ onLocationChange }: LocationSelectorProps) => {
  const { user } = useAuth();
  const { addresses, loading: addressesLoading, getDefaultAddress } = useSavedAddresses();
  const { region, loading: regionLoading } = useActiveRegion();
  const { cities: serviceCities } = useServiceCities();
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [detectingGPS, setDetectingGPS] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isInServiceArea, setIsInServiceArea] = useState<boolean | null>(null);

  // Set default location based on active region
  useEffect(() => {
    if (!regionLoading && region && !currentLocation) {
      setCurrentLocation(`${region.city_name}, ${region.state}`);
      setIsInServiceArea(true);
      onLocationChange?.({
        address: `${region.city_name}, ${region.state}`,
        lat: region.center_lat,
        lng: region.center_lng,
        cityId: region.city_id,
        inServiceArea: true,
      });
    }
  }, [region, regionLoading, currentLocation, onLocationChange]);

  // Set default address on load if user has saved addresses
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId && user) {
      const defaultAddr = getDefaultAddress();
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setCurrentLocation(`${defaultAddr.label} - ${defaultAddr.neighborhood}`);
        
        // Check if within service area
        let inArea = false;
        if (defaultAddr.lat && defaultAddr.lng && serviceCities.length > 0) {
          inArea = serviceCities.some(city => 
            isWithinServiceArea(defaultAddr.lat!, defaultAddr.lng!, city)
          );
        }
        setIsInServiceArea(inArea);
        
        onLocationChange?.({
          address: `${defaultAddr.address}, ${defaultAddr.number} - ${defaultAddr.neighborhood}`,
          lat: defaultAddr.lat,
          lng: defaultAddr.lng,
          inServiceArea: inArea,
        });
      }
    }
  }, [addresses, selectedAddressId, getDefaultAddress, onLocationChange, user, serviceCities]);

  const handleSelectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setCurrentLocation(`${address.label} - ${address.neighborhood}`);
    
    // Check if within service area
    let inArea = false;
    if (address.lat && address.lng && serviceCities.length > 0) {
      inArea = serviceCities.some(city => 
        isWithinServiceArea(address.lat!, address.lng!, city)
      );
    }
    setIsInServiceArea(inArea);
    
    onLocationChange?.({
      address: `${address.address}, ${address.number} - ${address.neighborhood}`,
      lat: address.lat,
      lng: address.lng,
      inServiceArea: inArea,
    });
  };

  const handleSelectServiceCity = (city: typeof serviceCities[0]) => {
    setSelectedAddressId(null);
    setCurrentLocation(`${city.name}, ${city.state_name}`);
    setIsInServiceArea(true);
    onLocationChange?.({
      address: `${city.name}, ${city.state_name}`,
      lat: city.center_lat,
      lng: city.center_lng,
      cityId: city.id,
      inServiceArea: true,
    });
  };

  const handleDetectGPS = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada pelo navegador");
      return;
    }

    setDetectingGPS(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Check if within any service area
        let inArea = false;
        let matchedCity: typeof serviceCities[0] | null = null;
        if (serviceCities.length > 0) {
          for (const city of serviceCities) {
            if (isWithinServiceArea(latitude, longitude, city)) {
              inArea = true;
              matchedCity = city;
              break;
            }
          }
        }
        setIsInServiceArea(inArea);
        
        try {
          // Reverse geocode using Google Maps API
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR`
          );
          const data = await response.json();

          if (data.results && data.results[0]) {
            const result = data.results[0];
            const neighborhood = result.address_components.find(
              (c: any) => c.types.includes("sublocality_level_1") || c.types.includes("neighborhood")
            )?.long_name || "Localização atual";

            setSelectedAddressId(null);
            setCurrentLocation(`📍 ${neighborhood}`);
            onLocationChange?.({
              address: result.formatted_address,
              lat: latitude,
              lng: longitude,
              cityId: matchedCity?.id,
              inServiceArea: inArea,
            });
            
            if (inArea) {
              toast.success("Localização detectada!");
            } else {
              toast.info("Você está fora da nossa área de entrega. Mostrando lojas para retirada.", {
                duration: 5000,
              });
            }
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          setCurrentLocation(`📍 Localização atual`);
          onLocationChange?.({
            address: "Localização atual",
            lat: latitude,
            lng: longitude,
            inServiceArea: inArea,
          });
        }
        
        setDetectingGPS(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let message = "Não foi possível detectar sua localização";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Permissão de localização negada";
        }
        toast.error(message);
        setDetectingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 text-sm bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-sm transition-all shadow-sm">
          <MapPin className="w-4 h-4" />
          <span className="font-medium max-w-[180px] truncate">{currentLocation || "Selecionar cidade"}</span>
          {isInServiceArea === false && (
            <AlertTriangle className="w-3 h-3 text-amber-400" />
          )}
          <ChevronDown className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {/* GPS Detection */}
        <DropdownMenuItem onClick={handleDetectGPS} disabled={detectingGPS}>
          {detectingGPS ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 mr-2 text-primary" />
          )}
          <span>{detectingGPS ? "Detectando..." : "Usar minha localização"}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />

        {/* Service Cities */}
        {serviceCities.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Cidades atendidas
            </DropdownMenuLabel>
            {serviceCities.map((city) => (
              <DropdownMenuItem
                key={city.id}
                onClick={() => handleSelectServiceCity(city)}
                className={currentLocation.includes(city.name) ? "bg-primary/10" : ""}
              >
                <MapPin className="w-4 h-4 mr-2 text-primary" />
                <span>{city.name}, {city.state_name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Saved Addresses */}
        {user && addresses.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Endereços salvos
            </DropdownMenuLabel>
            {addresses.map((address) => {
              const IconComponent = labelIcons[address.label] || MapPin;
              const isSelected = selectedAddressId === address.id;
              
              return (
                <DropdownMenuItem
                  key={address.id}
                  onClick={() => handleSelectAddress(address)}
                  className={isSelected ? "bg-primary/10" : ""}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{address.label}</span>
                      {address.is_default && (
                        <Star className="w-3 h-3 fill-primary text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {address.neighborhood}, {address.city}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Add Address Link */}
        {user ? (
          <DropdownMenuItem asChild>
            <a href="/enderecos" className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />
              <span>Adicionar endereço</span>
            </a>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <a href="/auth" className="cursor-pointer">
              <MapPin className="w-4 h-4 mr-2" />
              <span>Entre para salvar endereços</span>
            </a>
          </DropdownMenuItem>
        )}

        {addressesLoading && (
          <DropdownMenuItem disabled>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span>Carregando endereços...</span>
          </DropdownMenuItem>
        )}

        {/* Out of service area notice */}
        {isInServiceArea === false && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md mx-2 mb-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Você está fora da área de entrega. Apenas retirada disponível.</span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};