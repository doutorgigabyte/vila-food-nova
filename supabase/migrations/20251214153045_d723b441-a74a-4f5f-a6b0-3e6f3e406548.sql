-- Fix is_establishment_manager function with proper search_path
CREATE OR REPLACE FUNCTION public.is_establishment_manager(p_user_id uuid, p_establishment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM establishment_users
    WHERE user_id = p_user_id 
    AND establishment_id = p_establishment_id 
    AND role = 'manager'
    AND is_active = true
  );
END;
$function$;

-- Fix user_has_establishment_access function with proper search_path
CREATE OR REPLACE FUNCTION public.user_has_establishment_access(p_user_id uuid, p_establishment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM establishment_users
    WHERE user_id = p_user_id 
    AND establishment_id = p_establishment_id 
    AND is_active = true
  );
END;
$function$;