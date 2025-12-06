-- Criar enum para tipos de notificação
CREATE TYPE notification_type AS ENUM (
  'new_order',
  'order_confirmed',
  'order_preparing',
  'order_ready',
  'order_out_for_delivery',
  'order_delivered',
  'order_cancelled',
  'payment_received',
  'payment_failed',
  'low_stock',
  'new_delivery',
  'delivery_assigned',
  'delivery_completed',
  'system_alert',
  'maintenance',
  'new_review',
  'new_customer',
  'table_call'
);

-- Criar enum para prioridade
CREATE TYPE notification_priority AS ENUM ('critical', 'high', 'medium', 'low');

-- Tabela de notificações
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  target_roles TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de preferências de notificação por usuário
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  sound_enabled BOOLEAN DEFAULT true,
  vibration_enabled BOOLEAN DEFAULT true,
  volume INTEGER DEFAULT 80 CHECK (volume >= 0 AND volume <= 100),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  disabled_types TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_notifications_establishment ON public.notifications(establishment_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_unread ON public.notifications(establishment_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies para notifications
CREATE POLICY "Users can view notifications for their establishment"
ON public.notifications FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM establishments 
    WHERE id = notifications.establishment_id 
    AND owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM establishment_users 
    WHERE establishment_id = notifications.establishment_id 
    AND user_id = auth.uid() 
    AND is_active = true
  ) OR
  has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM establishments 
    WHERE id = notifications.establishment_id 
    AND owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM establishment_users 
    WHERE establishment_id = notifications.establishment_id 
    AND user_id = auth.uid() 
    AND is_active = true
  )
);

-- RLS Policies para notification_preferences
CREATE POLICY "Users can manage their own preferences"
ON public.notification_preferences FOR ALL
USING (user_id = auth.uid());

-- Enable realtime para notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();