import { useState, useCallback } from 'react';

export interface DeliveryStop {
  id: string;
  orderId: string;
  type: 'pickup' | 'delivery';
  lat: number;
  lng: number;
  address: string;
  establishmentName?: string;
  customerName?: string;
  estimatedTime?: number;
}

export interface OptimizedRoute {
  stops: DeliveryStop[];
  totalDistance: number;
  totalDuration: number;
  savings: {
    distanceSaved: number;
    timeSaved: number;
  };
}

// Haversine formula to calculate distance between two coordinates
const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate total route distance
const calculateRouteDistance = (stops: DeliveryStop[], startLat: number, startLng: number): number => {
  let totalDistance = 0;
  let currentLat = startLat;
  let currentLng = startLng;

  for (const stop of stops) {
    totalDistance += haversineDistance(currentLat, currentLng, stop.lat, stop.lng);
    currentLat = stop.lat;
    currentLng = stop.lng;
  }

  return totalDistance;
};

// Nearest neighbor algorithm for route optimization
const nearestNeighborOptimization = (
  stops: DeliveryStop[],
  startLat: number,
  startLng: number
): DeliveryStop[] => {
  if (stops.length <= 1) return stops;

  const optimized: DeliveryStop[] = [];
  const remaining = [...stops];
  let currentLat = startLat;
  let currentLng = startLng;

  // Group by order: pickup must come before delivery
  const orderPickups = new Map<string, DeliveryStop>();
  const orderDeliveries = new Map<string, DeliveryStop>();

  for (const stop of stops) {
    if (stop.type === 'pickup') {
      orderPickups.set(stop.orderId, stop);
    } else {
      orderDeliveries.set(stop.orderId, stop);
    }
  }

  while (remaining.length > 0) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const stop = remaining[i];
      
      // Check if this is a delivery and its pickup hasn't been done
      if (stop.type === 'delivery') {
        const pickup = orderPickups.get(stop.orderId);
        if (pickup && !optimized.find(s => s.id === pickup.id)) {
          continue; // Skip delivery if pickup not done
        }
      }

      const distance = haversineDistance(currentLat, currentLng, stop.lat, stop.lng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    if (nearestIndex >= 0) {
      const nextStop = remaining[nearestIndex];
      optimized.push(nextStop);
      currentLat = nextStop.lat;
      currentLng = nextStop.lng;
      remaining.splice(nearestIndex, 1);
    } else {
      // No valid stop found, add remaining in order
      optimized.push(...remaining);
      break;
    }
  }

  return optimized;
};

// 2-opt improvement for route optimization
const twoOptImprovement = (
  stops: DeliveryStop[],
  startLat: number,
  startLng: number,
  maxIterations: number = 100
): DeliveryStop[] => {
  if (stops.length <= 2) return stops;

  let bestRoute = [...stops];
  let improved = true;
  let iterations = 0;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let j = i + 2; j < bestRoute.length; j++) {
        // Check if swap is valid (respects pickup before delivery)
        const newRoute = [
          ...bestRoute.slice(0, i + 1),
          ...bestRoute.slice(i + 1, j + 1).reverse(),
          ...bestRoute.slice(j + 1)
        ];

        // Validate pickup-delivery order
        let isValid = true;
        const seenPickups = new Set<string>();
        for (const stop of newRoute) {
          if (stop.type === 'pickup') {
            seenPickups.add(stop.orderId);
          } else if (!seenPickups.has(stop.orderId)) {
            isValid = false;
            break;
          }
        }

        if (!isValid) continue;

        const currentDistance = calculateRouteDistance(bestRoute, startLat, startLng);
        const newDistance = calculateRouteDistance(newRoute, startLat, startLng);

        if (newDistance < currentDistance) {
          bestRoute = newRoute;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
};

export const useRouteOptimization = () => {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);

  const optimizeRoute = useCallback(async (
    stops: DeliveryStop[],
    driverLocation: { lat: number; lng: number }
  ): Promise<OptimizedRoute> => {
    setOptimizing(true);

    try {
      // Calculate original distance
      const originalDistance = calculateRouteDistance(stops, driverLocation.lat, driverLocation.lng);

      // Apply nearest neighbor algorithm
      let optimizedStops = nearestNeighborOptimization(
        stops,
        driverLocation.lat,
        driverLocation.lng
      );

      // Apply 2-opt improvement
      optimizedStops = twoOptImprovement(
        optimizedStops,
        driverLocation.lat,
        driverLocation.lng
      );

      // Calculate optimized distance
      const optimizedDistance = calculateRouteDistance(
        optimizedStops,
        driverLocation.lat,
        driverLocation.lng
      );

      // Estimate time (assuming 30 km/h average speed in urban area)
      const avgSpeedKmH = 30;
      const originalDuration = (originalDistance / avgSpeedKmH) * 60; // minutes
      const optimizedDuration = (optimizedDistance / avgSpeedKmH) * 60;

      // Add estimated time to each stop
      let cumulativeTime = 0;
      let currentLat = driverLocation.lat;
      let currentLng = driverLocation.lng;

      for (const stop of optimizedStops) {
        const distance = haversineDistance(currentLat, currentLng, stop.lat, stop.lng);
        cumulativeTime += (distance / avgSpeedKmH) * 60;
        stop.estimatedTime = Math.round(cumulativeTime);
        currentLat = stop.lat;
        currentLng = stop.lng;
      }

      const result: OptimizedRoute = {
        stops: optimizedStops,
        totalDistance: Math.round(optimizedDistance * 10) / 10,
        totalDuration: Math.round(optimizedDuration),
        savings: {
          distanceSaved: Math.round((originalDistance - optimizedDistance) * 10) / 10,
          timeSaved: Math.round(originalDuration - optimizedDuration)
        }
      };

      setOptimizedRoute(result);
      return result;
    } finally {
      setOptimizing(false);
    }
  }, []);

  const clearOptimization = useCallback(() => {
    setOptimizedRoute(null);
  }, []);

  return {
    optimizing,
    optimizedRoute,
    optimizeRoute,
    clearOptimization
  };
};
