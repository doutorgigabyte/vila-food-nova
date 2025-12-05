import { useState, useEffect } from "react";
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
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSavedAddresses, SavedAddress } from "@/hooks/useSavedAddresses";
import { toast } from "sonner";

interface LocationSelectorProps {
  onLocationChange?: (location: { address: string; lat?: number; lng?: number }) => void;
}

const labelIcons: Record<string, typeof Home> = {
  "Casa": Home,
  "Trabalho": Building,
  "Favorito": Heart,
};

export const LocationSelector = ({ onLocationChange }: LocationSelectorProps) => {
  const { user } = useAuth();
  const { addresses, loading: addressesLoading, getDefaultAddress } = useSavedAddresses();
  const [currentLocation, setCurrentLocation] = useState<string>("Tamandaré, PE");
  const [detectingGPS, setDetectingGPS] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Set default address on load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = getDefaultAddress();
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setCurrentLocation(`${defaultAddr.label} - ${defaultAddr.neighborhood}`);
        onLocationChange?.({
          address: `${defaultAddr.address}, ${defaultAddr.number} - ${defaultAddr.neighborhood}`,
          lat: defaultAddr.lat,
          lng: defaultAddr.lng,
        });
      }
    }
  }, [addresses, selectedAddressId, getDefaultAddress, onLocationChange]);

  const handleSelectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id);
    setCurrentLocation(`${address.label} - ${address.neighborhood}`);
    onLocationChange?.({
      address: `${address.address}, ${address.number} - ${address.neighborhood}`,
      lat: address.lat,
      lng: address.lng,
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
        
        try {
          // Reverse geocode using Google Maps API
          const apiKey = "AIzaSyAIl_jZHOswjHwpXwHpDlnyacOUcRYXVco";
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=pt-BR`
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
            });
            toast.success("Localização detectada!");
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          setCurrentLocation(`📍 Localização atual`);
          onLocationChange?.({
            address: "Localização atual",
            lat: latitude,
            lng: longitude,
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
        <button className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
          <MapPin className="w-4 h-4" />
          <span className="font-medium max-w-[180px] truncate">{currentLocation}</span>
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
            <a href="/checkout" className="cursor-pointer">
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
