-- Add new columns to establishments table for enhanced registration
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS cnpj_cpf text,
ADD COLUMN IF NOT EXISTS address_complement text,
ADD COLUMN IF NOT EXISTS avg_prep_time integer DEFAULT 30;