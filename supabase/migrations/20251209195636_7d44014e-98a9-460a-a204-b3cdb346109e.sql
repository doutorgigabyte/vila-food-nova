-- Table for storing WhatsApp authentication codes
CREATE TABLE IF NOT EXISTS public.auth_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('login', 'verification', 'password_reset')),
  establishment_id UUID REFERENCES public.establishments(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_auth_codes_phone_code ON public.auth_codes(phone, code);
CREATE INDEX idx_auth_codes_expires ON public.auth_codes(expires_at);

-- Enable RLS
ALTER TABLE public.auth_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can access auth codes (for security)
CREATE POLICY "Service role only" ON public.auth_codes
  FOR ALL USING (false);

-- Add functions config to config.toml for new functions
COMMENT ON TABLE public.auth_codes IS 'Stores WhatsApp authentication codes for login, verification, and password reset';