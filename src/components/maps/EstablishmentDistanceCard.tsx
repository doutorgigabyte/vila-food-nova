import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useGeolocation, calculateDistance } from '@/hooks/useGeolocation';
import { MapPin, Navigation } from 'lucide-react';

interface EstablishmentDistanceCardProps {
  establishmentLat?: number | null;
  establishmentLng?: number | null;
  showDistance?: boolean;
  className?: string;
}

const EstablishmentDistanceCard = ({
  establishmentLat,
  establishmentLng,
  showDistance = true,
  className = '',
}: EstablishmentDistanceCardProps) => {
  const [distance, setDistance] = useState<number | null>(null);
  const { latitude, longitude, getCurrentPosition, loading } = useGeolocation();

  useEffect(() => {
    if (!showDistance) return;
    
    // Try to get location on mount
    getCurrentPosition();
  }, [showDistance]);

  useEffect(() => {
    if (latitude && longitude && establishmentLat && establishmentLng) {
      const dist = calculateDistance(latitude, longitude, establishmentLat, establishmentLng);
      setDistance(dist);
    }
  }, [latitude, longitude, establishmentLat, establishmentLng]);

  if (!showDistance || !establishmentLat || !establishmentLng) {
    return null;
  }

  if (loading) {
    return (
      <Badge variant="outline" className={`gap-1 ${className}`}>
        <Navigation className="w-3 h-3 animate-pulse" />
        <span className="text-xs">Localizando...</span>
      </Badge>
    );
  }

  if (distance !== null) {
    return (
      <Badge variant="outline" className={`gap-1 ${className}`}>
        <MapPin className="w-3 h-3" />
        <span className="text-xs">{distance.toFixed(1)} km</span>
      </Badge>
    );
  }

  return null;
};

export default EstablishmentDistanceCard;
