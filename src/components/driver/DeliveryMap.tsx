import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Package, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeliveryMapProps {
  driverLocation?: { lat: number; lng: number } | null;
  pickupLocation?: { lat: number; lng: number } | null;
  deliveryLocation?: { lat: number; lng: number } | null;
  establishmentName?: string;
  customerAddress?: string;
  className?: string;
}

const DeliveryMap = ({
  driverLocation,
  pickupLocation,
  deliveryLocation,
  establishmentName,
  customerAddress,
  className
}: DeliveryMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const center = driverLocation || pickupLocation || { lat: -8.7562, lng: -35.0873 };
    
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    });

    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#3b82f6',
        strokeWeight: 4,
      },
    });
    renderer.setMap(map);

    setMapInstance(map);
    setDirectionsRenderer(renderer);
  }, []);

  // Update markers and route
  useEffect(() => {
    if (!mapInstance) return;

    // Clear existing markers (we'll track them properly in a real implementation)
    
    // Driver marker
    if (driverLocation) {
      new google.maps.Marker({
        position: driverLocation,
        map: mapInstance,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        title: 'Sua localização',
      });
    }

    // Pickup marker
    if (pickupLocation) {
      new google.maps.Marker({
        position: pickupLocation,
        map: mapInstance,
        icon: {
          url: 'data:image/svg+xml,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" width="32" height="32">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32),
        },
        title: establishmentName || 'Retirada',
      });
    }

    // Delivery marker
    if (deliveryLocation) {
      new google.maps.Marker({
        position: deliveryLocation,
        map: mapInstance,
        icon: {
          url: 'data:image/svg+xml,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#22c55e" width="32" height="32">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32),
        },
        title: customerAddress || 'Entrega',
      });
    }

    // Draw route
    if (directionsRenderer && driverLocation && (deliveryLocation || pickupLocation)) {
      const directionsService = new google.maps.DirectionsService();
      
      const destination = deliveryLocation || pickupLocation;
      if (destination) {
        directionsService.route({
          origin: driverLocation,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
        }, (result, status) => {
          if (status === 'OK' && result) {
            directionsRenderer.setDirections(result);
          }
        });
      }
    }

    // Fit bounds to show all markers
    const bounds = new google.maps.LatLngBounds();
    if (driverLocation) bounds.extend(driverLocation);
    if (pickupLocation) bounds.extend(pickupLocation);
    if (deliveryLocation) bounds.extend(deliveryLocation);
    
    if (!bounds.isEmpty()) {
      mapInstance.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    }
  }, [mapInstance, directionsRenderer, driverLocation, pickupLocation, deliveryLocation, establishmentName, customerAddress]);

  return (
    <Card className={cn(
      'overflow-hidden transition-all duration-300',
      isExpanded ? 'fixed inset-4 z-50' : 'relative',
      className
    )}>
      <div className="relative h-full min-h-[200px]">
        <div ref={mapRef} className="w-full h-full min-h-[200px]" />
        
        {/* Legend */}
        <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Você</span>
          </div>
          {pickupLocation && (
            <div className="flex items-center gap-2">
              <Package className="w-3 h-3 text-amber-500" />
              <span>Retirada</span>
            </div>
          )}
          {deliveryLocation && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-green-500" />
              <span>Entrega</span>
            </div>
          )}
        </div>

        {/* Expand/Collapse button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );
};

export default DeliveryMap;
