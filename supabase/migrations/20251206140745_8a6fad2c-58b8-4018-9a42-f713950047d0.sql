-- Create user behavior logs table for tracking user interactions
CREATE TABLE public.user_behavior_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'view', 'click', 'add_to_cart', 'purchase', 'search'
  entity_type TEXT, -- 'product', 'establishment', 'category'
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_user_behavior_user_id ON public.user_behavior_logs(user_id);
CREATE INDEX idx_user_behavior_session ON public.user_behavior_logs(session_id);
CREATE INDEX idx_user_behavior_action ON public.user_behavior_logs(action_type);
CREATE INDEX idx_user_behavior_entity ON public.user_behavior_logs(entity_type, entity_id);
CREATE INDEX idx_user_behavior_created ON public.user_behavior_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_behavior_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own behavior logs
CREATE POLICY "Users can view own behavior logs"
ON public.user_behavior_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Anyone can insert behavior logs (for anonymous tracking)
CREATE POLICY "Anyone can insert behavior logs"
ON public.user_behavior_logs
FOR INSERT
WITH CHECK (true);

-- Policy: Super admins can view all behavior logs for analytics
CREATE POLICY "Super admins can view all behavior logs"
ON public.user_behavior_logs
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));