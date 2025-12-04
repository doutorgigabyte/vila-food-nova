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
  coordinates: { lat: number; lng: number }[];
  radius_km: number | null;
  neighborhoods: string[];
  zip_codes: string[];
  fee: number;
  min_time: number;
  max_time: number;
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

    // Get establishment data
    const { data: establishment, error: estError } = await supabase
      .from("establishments")
      .select("id, latitude, longitude, max_delivery_radius_km, delivery_base_fee, delivery_fee_per_km, name")
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

    // Calculate distance
    const distance = calculateDistance(
      establishment.latitude,
      establishment.longitude,
      customer_lat,
      customer_lng
    );

    console.log(`Distance: ${distance.toFixed(2)} km`);

    // Get delivery zones
    const { data: zones, error: zonesError } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("establishment_id", establishment_id)
      .eq("is_active", true);

    if (zonesError) {
      console.error("Error fetching zones:", zonesError);
    }

    let matchedZone: DeliveryZone | null = null;
    const customerPoint = { lat: customer_lat, lng: customer_lng };

    // Check zones
    if (zones && zones.length > 0) {
      for (const zone of zones) {
        // Check by CEP
        if (customer_cep && zone.zip_codes?.includes(customer_cep)) {
          matchedZone = zone;
          console.log(`Matched by CEP: ${zone.name}`);
          break;
        }

        // Check by radius
        if (zone.type === "radius" && zone.radius_km) {
          if (distance <= zone.radius_km) {
            matchedZone = zone;
            console.log(`Matched by radius: ${zone.name}`);
            break;
          }
        }

        // Check by polygon
        if (zone.type === "polygon" && zone.coordinates?.length > 2) {
          if (isPointInPolygon(customerPoint, zone.coordinates)) {
            matchedZone = zone;
            console.log(`Matched by polygon: ${zone.name}`);
            break;
          }
        }
      }
    }

    // Check if within max delivery radius
    const maxRadius = establishment.max_delivery_radius_km || 10;
    const canDeliver = distance <= maxRadius || matchedZone !== null;

    // Calculate fee
    let deliveryFee: number;
    let estimatedMinTime: number;
    let estimatedMaxTime: number;

    if (matchedZone) {
      deliveryFee = matchedZone.fee;
      estimatedMinTime = matchedZone.min_time;
      estimatedMaxTime = matchedZone.max_time;
    } else {
      // Calculate based on distance
      const baseFee = establishment.delivery_base_fee || 5;
      const feePerKm = establishment.delivery_fee_per_km || 1.5;
      deliveryFee = baseFee + (distance * feePerKm);
      
      // Estimate time (roughly 3 min per km + 15 min prep)
      const baseTime = 15;
      const timePerKm = 3;
      estimatedMinTime = Math.round(baseTime + (distance * timePerKm * 0.8));
      estimatedMaxTime = Math.round(baseTime + (distance * timePerKm * 1.2));
    }

    // Round fee to 2 decimal places
    deliveryFee = Math.round(deliveryFee * 100) / 100;

    const response = {
      success: true,
      can_deliver: canDeliver,
      distance_km: Math.round(distance * 100) / 100,
      delivery_fee: deliveryFee,
      estimated_min_time: estimatedMinTime,
      estimated_max_time: estimatedMaxTime,
      zone_name: matchedZone?.name || null,
      establishment_name: establishment.name,
      max_radius_km: maxRadius,
      message: canDeliver 
        ? `Entrega disponível! Taxa: R$ ${deliveryFee.toFixed(2)}`
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
