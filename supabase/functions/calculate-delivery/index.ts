import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeliveryRequest {
  establishment_id: string;
  customer_lat: number;
  customer_lng: number;
  customer_address?: string;
  customer_cep?: string;
}

interface DeliveryZone {
  id: string;
  name: string;
  type: string;
  delivery_mode: 'free' | 'minimum' | 'standard' | 'turbo';
  coordinates: { lat: number; lng: number }[];
  radius_km: number | null;
  neighborhoods: string[];
  zip_codes: string[];
  fee: number;
  min_time: number;
  max_time: number;
  turbo_min_time: number;
  turbo_max_time: number;
}

interface Establishment {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  max_delivery_radius_km: number;
  delivery_base_fee: number;
  delivery_fee_per_km: number;
  free_delivery_radius_km: number;
  minimum_delivery_fee: number;
  minimum_delivery_radius_km: number;
  turbo_fee: number;
  turbo_radius_km: number;
  delivery_calculation_mode: 'distance' | 'fixed' | 'zone';
}

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Check if point is inside polygon using ray casting algorithm
function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    
    if (((yi > point.lng) !== (yj > point.lng)) &&
        (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Check if point is within radius
function isPointInRadius(
  point: { lat: number; lng: number },
  center: { lat: number; lng: number },
  radiusKm: number
): boolean {
  const distance = calculateDistance(center.lat, center.lng, point.lat, point.lng);
  return distance <= radiusKm;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: DeliveryRequest = await req.json();
    const { establishment_id, customer_lat, customer_lng, customer_cep } = body;

    console.log(`Calculating delivery for establishment ${establishment_id}`);
    console.log(`Customer location: ${customer_lat}, ${customer_lng}`);

    // Get establishment data with new delivery configuration fields
    const { data: establishment, error: estError } = await supabase
      .from("establishments")
      .select(`
        id, name, latitude, longitude, 
        max_delivery_radius_km, delivery_base_fee, delivery_fee_per_km,
        free_delivery_radius_km, minimum_delivery_fee, minimum_delivery_radius_km,
        turbo_fee, turbo_radius_km, delivery_calculation_mode
      `)
      .eq("id", establishment_id)
      .single();

    if (estError || !establishment) {
      console.error("Establishment not found:", estError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Estabelecimento não encontrado",
          can_deliver: false 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (!establishment.latitude || !establishment.longitude) {
      console.error("Establishment has no location configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Estabelecimento não configurou localização",
          can_deliver: false 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const estLocation = { lat: establishment.latitude, lng: establishment.longitude };
    const customerPoint = { lat: customer_lat, lng: customer_lng };

    // Calculate distance
    const distance = calculateDistance(
      establishment.latitude,
      establishment.longitude,
      customer_lat,
      customer_lng
    );

    console.log(`Distance: ${distance.toFixed(2)} km`);

    // Get delivery zones by mode
    const { data: zones, error: zonesError } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("establishment_id", establishment_id)
      .eq("is_active", true);

    if (zonesError) {
      console.error("Error fetching zones:", zonesError);
    }

    // Group zones by delivery mode
    const zonesByMode: Record<string, DeliveryZone[]> = {
      free: [],
      minimum: [],
      standard: [],
      turbo: []
    };

    if (zones) {
      for (const zone of zones) {
        const mode = zone.delivery_mode || 'standard';
        if (zonesByMode[mode]) {
          zonesByMode[mode].push(zone);
        }
      }
    }

    // Check if customer is in any zone
    const checkZoneMatch = (zone: DeliveryZone): boolean => {
      // Check by CEP
      if (customer_cep && zone.zip_codes?.includes(customer_cep)) {
        return true;
      }
      // Check by radius
      if (zone.type === "radius" && zone.radius_km) {
        return distance <= zone.radius_km;
      }
      // Check by polygon
      if (zone.type === "polygon" && zone.coordinates?.length > 2) {
        return isPointInPolygon(customerPoint, zone.coordinates);
      }
      return false;
    };

    // Establishment defaults
    const freeRadius = establishment.free_delivery_radius_km || 0;
    const minFeeRadius = establishment.minimum_delivery_radius_km || 1;
    const minFee = establishment.minimum_delivery_fee || 5;
    const baseFee = establishment.delivery_base_fee || 5;
    const feePerKm = establishment.delivery_fee_per_km || 1.5;
    const turboFee = establishment.turbo_fee || 15;
    const turboRadius = establishment.turbo_radius_km || 15;
    const maxRadius = establishment.max_delivery_radius_km || 10;
    const calcMode = establishment.delivery_calculation_mode || 'distance';

    // Initialize results
    let standardFee = 0;
    let turboFeeResult = turboFee;
    let isFreeZone = false;
    let isMinimumZone = false;
    let canDeliverStandard = false;
    let canDeliverTurbo = false;
    let matchedStandardZone: DeliveryZone | null = null;
    let matchedTurboZone: DeliveryZone | null = null;

    // 1. Check free zone first
    if (freeRadius > 0 && distance <= freeRadius) {
      isFreeZone = true;
      standardFee = 0;
      canDeliverStandard = true;
      console.log(`Customer in free delivery zone (radius: ${freeRadius}km)`);
    }
    
    // Check free zones from delivery_zones
    for (const zone of zonesByMode.free) {
      if (checkZoneMatch(zone)) {
        isFreeZone = true;
        standardFee = 0;
        canDeliverStandard = true;
        matchedStandardZone = zone;
        console.log(`Customer matched free zone: ${zone.name}`);
        break;
      }
    }

    // 2. Check minimum fee zone
    if (!isFreeZone) {
      if (minFeeRadius > 0 && distance <= minFeeRadius) {
        isMinimumZone = true;
        standardFee = minFee;
        canDeliverStandard = true;
        console.log(`Customer in minimum fee zone (radius: ${minFeeRadius}km, fee: ${minFee})`);
      }

      for (const zone of zonesByMode.minimum) {
        if (checkZoneMatch(zone)) {
          isMinimumZone = true;
          standardFee = zone.fee;
          canDeliverStandard = true;
          matchedStandardZone = zone;
          console.log(`Customer matched minimum zone: ${zone.name}`);
          break;
        }
      }
    }

    // 3. Check standard zone
    if (!isFreeZone && !isMinimumZone) {
      // First check specific standard zones
      for (const zone of zonesByMode.standard) {
        if (checkZoneMatch(zone)) {
          standardFee = zone.fee;
          canDeliverStandard = true;
          matchedStandardZone = zone;
          console.log(`Customer matched standard zone: ${zone.name}`);
          break;
        }
      }

      // If no zone matched, calculate by distance or max radius
      if (!matchedStandardZone && distance <= maxRadius) {
        canDeliverStandard = true;
        if (calcMode === 'distance') {
          standardFee = baseFee + (distance * feePerKm);
        } else if (calcMode === 'fixed') {
          standardFee = baseFee;
        }
        console.log(`Standard fee calculated by ${calcMode}: ${standardFee.toFixed(2)}`);
      }
    }

    // 4. Check turbo zone
    // First check specific turbo zones
    for (const zone of zonesByMode.turbo) {
      if (checkZoneMatch(zone)) {
        turboFeeResult = zone.fee;
        canDeliverTurbo = true;
        matchedTurboZone = zone;
        console.log(`Customer matched turbo zone: ${zone.name}`);
        break;
      }
    }

    // If no turbo zone matched, check turbo radius
    if (!matchedTurboZone && turboRadius > 0 && distance <= turboRadius) {
      canDeliverTurbo = true;
      console.log(`Customer in turbo radius: ${turboRadius}km`);
    }

    // If standard delivery is available, turbo is also available (with higher fee)
    if (canDeliverStandard && !canDeliverTurbo) {
      canDeliverTurbo = true;
    }

    // Round fees
    standardFee = Math.round(standardFee * 100) / 100;
    turboFeeResult = Math.round(turboFeeResult * 100) / 100;

    // Calculate time estimates
    const baseTime = 15;
    const timePerKm = 3;
    
    let standardMinTime = matchedStandardZone?.min_time || Math.round(baseTime + (distance * timePerKm * 0.8));
    let standardMaxTime = matchedStandardZone?.max_time || Math.round(baseTime + (distance * timePerKm * 1.2));
    let turboMinTime = matchedTurboZone?.turbo_min_time || matchedTurboZone?.min_time || 10;
    let turboMaxTime = matchedTurboZone?.turbo_max_time || matchedTurboZone?.max_time || 20;

    const canDeliver = canDeliverStandard || canDeliverTurbo;

    const response = {
      success: true,
      can_deliver: canDeliver,
      distance_km: Math.round(distance * 100) / 100,
      
      // Standard delivery
      standard_fee: standardFee,
      standard_available: canDeliverStandard,
      standard_time: {
        min: standardMinTime,
        max: standardMaxTime
      },
      
      // Turbo delivery
      turbo_fee: turboFeeResult,
      turbo_available: canDeliverTurbo,
      turbo_time: {
        min: turboMinTime,
        max: turboMaxTime
      },
      
      // Zone info
      is_free_zone: isFreeZone,
      is_minimum_zone: isMinimumZone,
      matched_zone: matchedStandardZone?.name || null,
      matched_turbo_zone: matchedTurboZone?.name || null,
      
      // Legacy fields for backwards compatibility
      delivery_fee: standardFee,
      estimated_min_time: standardMinTime,
      estimated_max_time: standardMaxTime,
      zone_name: matchedStandardZone?.name || null,
      establishment_name: establishment.name,
      max_radius_km: maxRadius,
      
      message: canDeliver 
        ? isFreeZone 
          ? "Entrega grátis para sua região!"
          : `Entrega disponível! Taxa: R$ ${standardFee.toFixed(2)}`
        : `Fora da área de entrega (distância: ${distance.toFixed(1)} km, máximo: ${maxRadius} km)`,
    };

    console.log("Response:", response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        can_deliver: false 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
