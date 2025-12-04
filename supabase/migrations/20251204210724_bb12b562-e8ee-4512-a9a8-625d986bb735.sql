-- Create banners table for establishments
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  title TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active banners" ON public.banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Establishment owners can manage banners" ON public.banners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM establishments
      WHERE establishments.id = banners.establishment_id
      AND establishments.owner_id = auth.uid()
    )
  );

-- Create cash_flow table for financial tracking
CREATE TABLE public.cash_flow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT,
  description TEXT,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Establishment owners can manage cash flow" ON public.cash_flow
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM establishments
      WHERE establishments.id = cash_flow.establishment_id
      AND establishments.owner_id = auth.uid()
    )
  );

-- Create qr_codes table
CREATE TABLE public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('menu', 'table', 'delivery')),
  table_number TEXT,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active QR codes" ON public.qr_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Establishment owners can manage QR codes" ON public.qr_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM establishments
      WHERE establishments.id = qr_codes.establishment_id
      AND establishments.owner_id = auth.uid()
    )
  );