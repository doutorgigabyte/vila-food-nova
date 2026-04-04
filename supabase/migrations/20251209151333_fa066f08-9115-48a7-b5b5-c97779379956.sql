-- Create platform_settings table for global platform configuration
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage platform settings
CREATE POLICY "Super admins can manage platform settings"
ON public.platform_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Insert default gateway settings
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES 
  ('gateway_mercadopago_enabled', 'true', 'Mercado Pago habilitado na plataforma'),
  ('gateway_pagseguro_enabled', 'true', 'PagSeguro habilitado na plataforma'),
  ('gateway_pix_static_enabled', 'true', 'PIX estático habilitado na plataforma'),
  ('gateway_cash_enabled', 'true', 'Pagamento em dinheiro habilitado na plataforma')
ON CONFLICT (setting_key) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();