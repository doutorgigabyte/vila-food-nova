-- Table for anomaly detection configuration
CREATE TABLE IF NOT EXISTS public.anomaly_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  config_type TEXT NOT NULL CHECK (config_type IN ('global', 'establishment')),
  transaction_threshold NUMERIC DEFAULT 1000,
  failed_attempts_threshold INTEGER DEFAULT 5,
  suspicious_time_start TIME DEFAULT '00:00:00',
  suspicious_time_end TIME DEFAULT '06:00:00',
  alert_whatsapp BOOLEAN DEFAULT true,
  alert_email BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for anomaly alerts log
CREATE TABLE IF NOT EXISTS public.anomaly_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('high_value', 'failed_attempts', 'suspicious_time', 'unusual_pattern')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  transaction_id UUID,
  amount NUMERIC,
  metadata JSONB DEFAULT '{}',
  notified_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anomaly_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anomaly_config
CREATE POLICY "Super admins can manage all anomaly config"
ON public.anomaly_config FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Establishment owners can view their anomaly config"
ON public.anomaly_config FOR SELECT
USING (
  establishment_id IN (
    SELECT id FROM establishments WHERE owner_id = auth.uid()
  )
);

-- RLS Policies for anomaly_alerts
CREATE POLICY "Super admins can manage all anomaly alerts"
ON public.anomaly_alerts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Establishment owners can view their anomaly alerts"
ON public.anomaly_alerts FOR SELECT
USING (
  establishment_id IN (
    SELECT id FROM establishments WHERE owner_id = auth.uid()
  )
);

-- Insert default global config
INSERT INTO public.anomaly_config (config_type, transaction_threshold, failed_attempts_threshold, alert_whatsapp)
VALUES ('global', 5000, 5, true)
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX idx_anomaly_alerts_establishment ON public.anomaly_alerts(establishment_id);
CREATE INDEX idx_anomaly_alerts_type ON public.anomaly_alerts(alert_type);
CREATE INDEX idx_anomaly_alerts_created ON public.anomaly_alerts(created_at DESC);