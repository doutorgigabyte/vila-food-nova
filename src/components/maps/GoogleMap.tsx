import { useEffect, useRef, useState, useCallback } from 'react';
import { GOOGLE_MAPS_API_KEY } from '@/lib/constants';

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: any;
    initGoogleMap: () => void;
  }
}

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    id: string;
    position: { lat: number; lng: number };
    title?: string;
    icon?: string;
  }>;
  polygon?: { lat: number; lng: number }[];
  onPolygonChange?: (coords: { lat: number; lng: number }[]) => void;
  editable?: boolean;
  drawingMode?: boolean;
  showUserLocation?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  className?: string;
  onMarkerClick?: (id: string) => void;
}


const GoogleMap = ({
  center = { lat: -8.7614, lng: -35.1087 }, // Tamandaré, PE
  zoom = 14,
  markers = [],
  polygon,
  onPolygonChange,
  editable = false,
  drawingMode = false,
  showUserLocation = false,
  userLocation,
  onMapClick,
  className = 'w-full h-96',
  onMarkerClick,
}: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    if (onMapClick) {
      mapInstanceRef.current.addListener('click', (e: any) => {
        if (e.latLng) {
          onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        }
      });
    }
  }, [isLoaded, center, zoom, onMapClick]);

  // Handle markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const marker = new window.google.maps.Marker({
        position: markerData.position,
        map: mapInstanceRef.current,
        title: markerData.title,
        icon: markerData.icon ? {
          url: markerData.icon,
          scaledSize: new window.google.maps.Size(40, 40),
        } : undefined,
      });

      if (onMarkerClick) {
        marker.addListener('click', () => onMarkerClick(markerData.id));
      }

      markersRef.current.push(marker);
    });
  }, [markers, isLoaded, onMarkerClick]);

  // Handle user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    if (showUserLocation && userLocation) {
      userMarkerRef.current = new window.google.maps.Marker({
        position: userLocation,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        title: 'Sua localização',
      });

      // Add accuracy circle
      new window.google.maps.Circle({
        map: mapInstanceRef.current,
        center: userLocation,
        radius: 100,
        fillColor: '#4285F4',
        fillOpacity: 0.1,
        strokeColor: '#4285F4',
        strokeOpacity: 0.3,
        strokeWeight: 1,
      });
    }
  }, [userLocation, showUserLocation, isLoaded]);

  // Handle polygon
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    if (polygonRef.current) {
      polygonRef.current.setMap(null);
    }

    if (polygon && polygon.length > 2) {
      polygonRef.current = new window.google.maps.Polygon({
        paths: polygon,
        strokeColor: '#FF6B35',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF6B35',
        fillOpacity: 0.2,
        editable,
        draggable: false,
        map: mapInstanceRef.current,
      });

      if (editable && onPolygonChange) {
        const path = polygonRef.current.getPath();
        
        ['set_at', 'insert_at', 'remove_at'].forEach(eventName => {
          window.google.maps.event.addListener(path, eventName, () => {
            const coords: { lat: number; lng: number }[] = [];
            path.forEach((latLng) => {
              coords.push({ lat: latLng.lat(), lng: latLng.lng() });
            });
            onPolygonChange(coords);
          });
        });
      }
    }
  }, [polygon, editable, isLoaded, onPolygonChange]);

  // Handle drawing mode
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !drawingMode) return;

    if (drawingManagerRef.current) {
      drawingManagerRef.current.setMap(null);
    }

    drawingManagerRef.current = new window.google.maps.drawing.DrawingManager({
      drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: '#FF6B35',
        fillOpacity: 0.2,
        strokeWeight: 2,
        strokeColor: '#FF6B35',
        editable: true,
      },
    });

    drawingManagerRef.current.setMap(mapInstanceRef.current);

    window.google.maps.event.addListener(
      drawingManagerRef.current,
      'polygoncomplete',
      (newPolygon: any) => {
        if (polygonRef.current) {
          polygonRef.current.setMap(null);
        }

        const coords: { lat: number; lng: number }[] = [];
        newPolygon.getPath().forEach((latLng) => {
          coords.push({ lat: latLng.lat(), lng: latLng.lng() });
        });

        if (onPolygonChange) {
          onPolygonChange(coords);
        }

        drawingManagerRef.current?.setDrawingMode(null);
      }
    );

    return () => {
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(null);
      }
    };
  }, [drawingMode, isLoaded, onPolygonChange]);

  // Update map center
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setCenter(center);
    }
  }, [center]);

  if (!isLoaded) {
    return (
      <div className={`${className} bg-muted animate-pulse flex items-center justify-center rounded-lg`}>
        <span className="text-muted-foreground">Carregando mapa...</span>
      </div>
    );
  }

  return <div ref={mapRef} className={`${className} rounded-lg`} />;
};

export default GoogleMap;
