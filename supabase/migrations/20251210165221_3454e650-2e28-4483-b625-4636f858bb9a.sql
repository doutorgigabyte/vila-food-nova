
-- Create establishment_roles table for custom roles per establishment
CREATE TABLE IF NOT EXISTS public.establishment_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(establishment_id, name)
);

-- Create role_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES public.establishment_roles(id) ON DELETE CASCADE NOT NULL,
  permission_key text NOT NULL, -- e.g. 'orders.view', 'products.edit', 'reports.view'
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(role_id, permission_key)
);

-- Create user_establishment_roles to assign roles to users
CREATE TABLE IF NOT EXISTS public.user_establishment_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES public.establishment_roles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, establishment_id, role_id)
);

-- Enable RLS
ALTER TABLE public.establishment_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_establishment_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for establishment_roles
CREATE POLICY "Establishments can manage their roles"
ON public.establishment_roles FOR ALL
USING (EXISTS (
  SELECT 1 FROM establishments 
  WHERE establishments.id = establishment_roles.establishment_id 
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all roles"
ON public.establishment_roles FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS policies for role_permissions
CREATE POLICY "Establishments can manage role permissions"
ON public.role_permissions FOR ALL
USING (EXISTS (
  SELECT 1 FROM establishment_roles er
  JOIN establishments e ON e.id = er.establishment_id
  WHERE er.id = role_permissions.role_id 
  AND e.owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all role permissions"
ON public.role_permissions FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS policies for user_establishment_roles
CREATE POLICY "Establishments can manage user roles"
ON public.user_establishment_roles FOR ALL
USING (EXISTS (
  SELECT 1 FROM establishments 
  WHERE establishments.id = user_establishment_roles.establishment_id 
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Users can view their own roles"
ON public.user_establishment_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all user roles"
ON public.user_establishment_roles FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create function to check establishment permission
CREATE OR REPLACE FUNCTION public.has_establishment_permission(
  p_user_id uuid, 
  p_establishment_id uuid, 
  p_permission text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_establishment_roles uer
    JOIN role_permissions rp ON rp.role_id = uer.role_id
    WHERE uer.user_id = p_user_id
      AND uer.establishment_id = p_establishment_id
      AND rp.permission_key = p_permission
  )
  OR EXISTS (
    SELECT 1 FROM establishments 
    WHERE id = p_establishment_id AND owner_id = p_user_id
  )
$$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_establishment_roles_establishment ON public.establishment_roles(establishment_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_user_establishment_roles_user ON public.user_establishment_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_establishment_roles_establishment ON public.user_establishment_roles(establishment_id);
