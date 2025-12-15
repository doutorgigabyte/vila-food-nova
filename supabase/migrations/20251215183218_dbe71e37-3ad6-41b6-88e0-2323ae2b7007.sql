-- Add bank account fields to establishments table
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_code TEXT,
ADD COLUMN IF NOT EXISTS bank_agency TEXT,
ADD COLUMN IF NOT EXISTS bank_agency_digit TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS bank_account_digit TEXT,
ADD COLUMN IF NOT EXISTS bank_account_type TEXT DEFAULT 'checking',
ADD COLUMN IF NOT EXISTS bank_holder_name TEXT,
ADD COLUMN IF NOT EXISTS bank_holder_cpf_cnpj TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_establishments_bank ON public.establishments(bank_code) WHERE bank_code IS NOT NULL;