-- Tabela de tags pré-definidas para avaliações
CREATE TABLE public.review_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('product', 'delivery', 'establishment', 'platform')),
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative')),
  rating_min INTEGER NOT NULL,
  rating_max INTEGER NOT NULL,
  tag_text TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de avaliações de entregadores (separada)
CREATE TABLE public.driver_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.delivery_drivers(id) ON DELETE SET NULL,
  customer_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 10),
  selected_tags JSONB DEFAULT '[]',
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de avaliações da plataforma (marketplace)
CREATE TABLE public.platform_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 10),
  selected_tags JSONB DEFAULT '[]',
  comment TEXT,
  order_channel TEXT DEFAULT 'marketplace',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de itens do Roadmap
CREATE TABLE public.roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'P3' CHECK (priority IN ('P1', 'P2', 'P3', 'P4', 'P5')),
  status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'testing', 'done')),
  estimated_hours INTEGER,
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar colunas na tabela reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS selected_tags JSONB DEFAULT '[]';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS rating_scale INTEGER CHECK (rating_scale >= 0 AND rating_scale <= 10);

-- Adicionar métricas na tabela delivery_drivers
ALTER TABLE public.delivery_drivers ADD COLUMN IF NOT EXISTS rating_average NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.delivery_drivers ADD COLUMN IF NOT EXISTS total_deliveries INTEGER DEFAULT 0;
ALTER TABLE public.delivery_drivers ADD COLUMN IF NOT EXISTS complaint_count INTEGER DEFAULT 0;

-- RLS para review_tags (público para leitura)
ALTER TABLE public.review_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active review tags" ON public.review_tags FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage review tags" ON public.review_tags FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS para driver_reviews
ALTER TABLE public.driver_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view driver reviews" ON public.driver_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create driver reviews" ON public.driver_reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS para platform_reviews
ALTER TABLE public.platform_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view platform reviews" ON public.platform_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create platform reviews" ON public.platform_reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS para roadmap_items
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can manage roadmap" ON public.roadmap_items FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Anyone can view roadmap" ON public.roadmap_items FOR SELECT USING (true);

-- Trigger para atualizar métricas do entregador
CREATE OR REPLACE FUNCTION public.update_driver_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.delivery_drivers
  SET 
    rating_average = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
      FROM public.driver_reviews
      WHERE driver_id = COALESCE(NEW.driver_id, OLD.driver_id)
    ),
    total_deliveries = (
      SELECT COUNT(*)
      FROM public.driver_reviews
      WHERE driver_id = COALESCE(NEW.driver_id, OLD.driver_id)
    ),
    complaint_count = (
      SELECT COUNT(*)
      FROM public.driver_reviews
      WHERE driver_id = COALESCE(NEW.driver_id, OLD.driver_id) AND rating <= 3
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.driver_id, OLD.driver_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_driver_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.driver_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_driver_rating();