-- Create driver invitation tokens table
CREATE TABLE public.driver_invitation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  used_by uuid REFERENCES public.delivery_drivers(id),
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

-- Make establishment_id optional in delivery_drivers for independent drivers
ALTER TABLE public.delivery_drivers ALTER COLUMN establishment_id DROP NOT NULL;

-- Enable RLS
ALTER TABLE public.driver_invitation_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for driver_invitation_tokens
CREATE POLICY "Establishments can manage their invitation tokens"
ON public.driver_invitation_tokens
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.establishments
    WHERE establishments.id = driver_invitation_tokens.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view valid tokens for registration"
ON public.driver_invitation_tokens
FOR SELECT
USING (
  expires_at > now() AND used_at IS NULL
);

-- Super admins can manage all tokens
CREATE POLICY "Super admins can manage all invitation tokens"
ON public.driver_invitation_tokens
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));