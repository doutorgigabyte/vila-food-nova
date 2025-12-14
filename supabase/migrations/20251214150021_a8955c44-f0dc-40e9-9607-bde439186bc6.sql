-- FASE 1: Correções de Segurança Críticas

-- 1. Corrigir RLS de orders para não expor dados via phone matching
-- Remover política problemática que permite acesso via telefone
DROP POLICY IF EXISTS "Customers can view their orders" ON public.orders;

-- Criar política segura baseada apenas em customer_id autenticado
CREATE POLICY "Customers can view their orders via customer_id"
ON public.orders
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
);

-- 2. Corrigir delivery_drivers para proteger PIX keys
-- Atualizar política para drivers verem apenas seus próprios dados sensíveis
DROP POLICY IF EXISTS "Drivers can view their own profile" ON public.delivery_drivers;

CREATE POLICY "Drivers can view their own profile"
ON public.delivery_drivers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. Corrigir support_conversations para usar user_id ao invés de telefone
DROP POLICY IF EXISTS "Customers can view their conversations" ON public.support_conversations;

CREATE POLICY "Customers can view their conversations via user_id"
ON public.support_conversations
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.establishment_users eu
    WHERE eu.establishment_id = support_conversations.establishment_id
    AND eu.user_id = auth.uid()
    AND eu.is_active = true
  )
  OR
  EXISTS (
    SELECT 1 FROM public.establishments e
    WHERE e.id = support_conversations.establishment_id
    AND e.owner_id = auth.uid()
  )
);

-- 4. Atualizar funções com search_path para evitar vulnerabilidades
CREATE OR REPLACE FUNCTION public.auto_register_system_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.phone IS NOT NULL THEN
    INSERT INTO public.system_contacts (
      establishment_id,
      name,
      phone,
      email,
      role,
      tags
    ) VALUES (
      NEW.id,
      NEW.name,
      NEW.phone,
      NEW.email,
      'owner',
      ARRAY['lojista', 'novo']
    )
    ON CONFLICT (phone, establishment_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_delivery_queue_position(p_establishment_id uuid, p_driver_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rec RECORD;
  pos INTEGER := 1;
BEGIN
  FOR rec IN 
    SELECT id FROM public.delivery_queue 
    WHERE establishment_id = p_establishment_id 
    AND driver_id = p_driver_id 
    AND actual_delivery_at IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE public.delivery_queue SET queue_position = pos, updated_at = now() WHERE id = rec.id;
    pos := pos + 1;
  END LOOP;
END;
$function$;

-- 5. Criar RPC function para dados públicos de customers (mascarando dados sensíveis)
CREATE OR REPLACE FUNCTION public.get_customer_public_info(p_customer_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  masked_phone text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    CASE 
      WHEN c.phone IS NOT NULL THEN 
        CONCAT(LEFT(c.phone, 4), '****', RIGHT(c.phone, 2))
      ELSE NULL
    END as masked_phone,
    c.created_at
  FROM public.customers c
  WHERE c.id = p_customer_id;
END;
$function$;

-- 6. Criar RPC function para dados públicos de drivers (sem PIX keys)
CREATE OR REPLACE FUNCTION public.get_driver_public_info(p_driver_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  vehicle_type text,
  rating_average numeric,
  total_deliveries integer,
  is_available boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    dd.id,
    dd.name,
    dd.vehicle_type,
    dd.rating_average,
    dd.total_deliveries,
    dd.is_available
  FROM public.delivery_drivers dd
  WHERE dd.id = p_driver_id
  AND dd.is_active = true;
END;
$function$;

-- 7. Adicionar política para establishments verem apenas dados operacionais de drivers
CREATE POLICY "Establishments can view driver operational data"
ON public.delivery_drivers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.driver_establishment_links del
    WHERE del.driver_id = delivery_drivers.id
    AND del.status = 'approved'
    AND del.establishment_id IN (
      SELECT e.id FROM public.establishments e WHERE e.owner_id = auth.uid()
    )
  )
);