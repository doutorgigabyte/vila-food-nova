-- Criar tabela de Vilas (agrupamentos de estabelecimentos)
CREATE TABLE public.vilas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  address TEXT,
  neighborhood TEXT,
  city_id UUID REFERENCES public.cities(id),
  latitude NUMERIC,
  longitude NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar coluna vila_id na tabela establishments (opcional)
ALTER TABLE public.establishments 
ADD COLUMN vila_id UUID REFERENCES public.vilas(id);

-- Criar índice para busca por vila
CREATE INDEX idx_establishments_vila_id ON public.establishments(vila_id);

-- Habilitar RLS
ALTER TABLE public.vilas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para vilas
CREATE POLICY "Anyone can view active vilas" 
ON public.vilas 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage vilas" 
ON public.vilas 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_vilas_updated_at
BEFORE UPDATE ON public.vilas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();