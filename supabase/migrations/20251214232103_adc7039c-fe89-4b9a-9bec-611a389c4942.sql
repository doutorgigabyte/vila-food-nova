-- Adicionar campos obrigatórios para homologação Mercado Pago
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS default_address jsonb;

-- Comentários explicativos
COMMENT ON COLUMN public.profiles.cpf IS 'CPF do cliente para pagamentos';
COMMENT ON COLUMN public.profiles.birth_date IS 'Data de nascimento do cliente';
COMMENT ON COLUMN public.profiles.default_address IS 'Endereço padrão com: zip_code, street_name, street_number, neighborhood, city, state';