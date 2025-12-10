import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeRequest {
  establishment_id: string;
  customer_address: string;
  customer_cep?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  min_time: number | null;
  max_time: number | null;
  type: string | null;
  radius_km: number | null;
  zip_codes: string[] | null;
  neighborhoods: string[] | null;
  coordinates: any;
  is_active: boolean;
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if point is inside polygon
function isPointInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    if (((yi > point.lat) !== (yj > point.lat)) &&
        (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Geocode address using Google Maps API
async function geocodeAddress(address: string, city: string, state: string): Promise<{ coordinates: Coordinates; formatted_address: string } | null> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!apiKey) {
    console.error('GOOGLE_API_KEY not configured');
    return null;
  }

  const fullAddress = `${address}, ${city}, ${state}, Brasil`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}&language=pt-BR`;

  console.log('Geocoding address:', fullAddress);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        },
        formatted_address: result.formatted_address
      };
    }

    console.error('Geocoding failed:', data.status, data.error_message);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { establishment_id, customer_address, customer_cep }: GeocodeRequest = await req.json();

    console.log('Request received:', { establishment_id, customer_address, customer_cep });

    if (!establishment_id || !customer_address) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'establishment_id and customer_address are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch establishment data
    const { data: establishment, error: estError } = await supabase
      .from('establishments')
      .select(`
        id, name, latitude, longitude, city_id, neighborhood,
        delivery_base_fee, delivery_fee_per_km, max_delivery_radius_km,
        avg_delivery_time, accepts_delivery,
        cities!inner(name, states!inner(name, uf))
      `)
      .eq('id', establishment_id)
      .single();

    if (estError || !establishment) {
      console.error('Establishment not found:', estError);
      return new Response(
        JSON.stringify({ success: false, error: 'Establishment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!establishment.accepts_delivery) {
      return new Response(
        JSON.stringify({ 
          success: true,
          can_deliver: false,
          reason: 'Este estabelecimento não realiza entregas'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cityName = (establishment.cities as any)?.name || '';
    const stateName = (establishment.cities as any)?.states?.uf || '';

    // Geocode customer address
    const geocodeResult = await geocodeAddress(customer_address, cityName, stateName);

    if (!geocodeResult) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível localizar o endereço. Tente ser mais específico.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { coordinates: customerCoords, formatted_address } = geocodeResult;
    console.log('Geocoded coordinates:', customerCoords, 'Formatted:', formatted_address);

    // Calculate distance
    const estLat = Number(establishment.latitude);
    const estLng = Number(establishment.longitude);
    
    if (!estLat || !estLng) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Estabelecimento não possui coordenadas configuradas' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const distanceKm = calculateDistance(estLat, estLng, customerCoords.lat, customerCoords.lng);
    console.log('Distance calculated:', distanceKm, 'km');

    // Fetch delivery zones
    const { data: zones } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('establishment_id', establishment_id)
      .eq('is_active', true)
      .order('fee', { ascending: true });

    let matchedZone: DeliveryZone | null = null;
    let deliveryFee = 0;
    let estimatedMinTime = establishment.avg_delivery_time || 30;
    let estimatedMaxTime = estimatedMinTime + 15;

    // Try to match a zone
    if (zones && zones.length > 0) {
      for (const zone of zones) {
        // Check by CEP
        if (customer_cep && zone.zip_codes && zone.zip_codes.length > 0) {
          const normalizedCep = customer_cep.replace(/\D/g, '');
          if (zone.zip_codes.some((z: string) => z.replace(/\D/g, '') === normalizedCep)) {
            matchedZone = zone;
            break;
          }
        }

        // Check by radius
        if (zone.type === 'radius' && zone.radius_km) {
          if (distanceKm <= zone.radius_km) {
            matchedZone = zone;
            break;
          }
        }

        // Check by polygon
        if (zone.type === 'polygon' && zone.coordinates) {
          try {
            const polygon = typeof zone.coordinates === 'string' 
              ? JSON.parse(zone.coordinates) 
              : zone.coordinates;
            if (Array.isArray(polygon) && isPointInPolygon(customerCoords, polygon)) {
              matchedZone = zone;
              break;
            }
          } catch (e) {
            console.error('Error parsing polygon:', e);
          }
        }
      }
    }

    // If zone matched, use zone settings
    if (matchedZone) {
      deliveryFee = matchedZone.fee;
      if (matchedZone.min_time) estimatedMinTime = matchedZone.min_time;
      if (matchedZone.max_time) estimatedMaxTime = matchedZone.max_time;
      console.log('Matched zone:', matchedZone.name);
    } else {
      // Fallback: calculate by distance
      const maxRadius = establishment.max_delivery_radius_km || 10;
      
      if (distanceKm > maxRadius) {
        return new Response(
          JSON.stringify({
            success: true,
            can_deliver: false,
            reason: `Endereço fora da área de entrega (${distanceKm.toFixed(1)}km). Raio máximo: ${maxRadius}km.`,
            distance_km: Math.round(distanceKm * 10) / 10,
            formatted_address,
            coordinates: customerCoords
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate fee by distance
      const baseFee = Number(establishment.delivery_base_fee) || 5;
      const feePerKm = Number(establishment.delivery_fee_per_km) || 1.5;
      deliveryFee = baseFee + (distanceKm * feePerKm);
      
      // Adjust time estimate by distance
      estimatedMinTime = Math.round(20 + (distanceKm * 3));
      estimatedMaxTime = Math.round(estimatedMinTime + 10 + (distanceKm * 2));
    }

    // Round fee to 2 decimal places
    deliveryFee = Math.round(deliveryFee * 100) / 100;

    console.log('Final result:', { deliveryFee, estimatedMinTime, estimatedMaxTime });

    return new Response(
      JSON.stringify({
        success: true,
        can_deliver: true,
        distance_km: Math.round(distanceKm * 10) / 10,
        delivery_fee: deliveryFee,
        delivery_fee_formatted: `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`,
        estimated_min_time: estimatedMinTime,
        estimated_max_time: estimatedMaxTime,
        estimated_time_formatted: `${estimatedMinTime}-${estimatedMaxTime} min`,
        zone_name: matchedZone?.name || null,
        formatted_address,
        coordinates: customerCoords,
        establishment_name: establishment.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
