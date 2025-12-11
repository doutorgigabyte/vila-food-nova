-- Create public_display_tokens table for Kitchen Display and VilaTok TV public access
CREATE TABLE public.public_display_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  display_type TEXT NOT NULL DEFAULT 'kitchen',
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create index for token lookup
CREATE INDEX idx_public_display_tokens_token ON public.public_display_tokens(token);
CREATE INDEX idx_public_display_tokens_establishment ON public.public_display_tokens(establishment_id);

-- Enable RLS
ALTER TABLE public.public_display_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public read access for valid tokens (needed for TV displays)
CREATE POLICY "Anyone can view active tokens by token value"
ON public.public_display_tokens
FOR SELECT
USING (is_active = true);

-- Allow establishment users to manage their tokens
CREATE POLICY "Establishment users can manage their tokens"
ON public.public_display_tokens
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = public_display_tokens.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = public_display_tokens.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);