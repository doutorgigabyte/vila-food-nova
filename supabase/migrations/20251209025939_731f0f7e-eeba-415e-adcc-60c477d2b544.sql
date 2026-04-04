-- Adicionar colunas para suporte multi-gateway em mp_transactions
ALTER TABLE public.mp_transactions 
ADD COLUMN IF NOT EXISTS gateway TEXT DEFAULT 'mercadopago',
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id);

-- Adicionar colunas PagBank em establishments
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS pagseguro_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS pagseguro_account_id TEXT,
ADD COLUMN IF NOT EXISTS pagseguro_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pagseguro_scope TEXT;

-- Índice para busca por gateway
CREATE INDEX IF NOT EXISTS idx_mp_transactions_gateway ON public.mp_transactions(gateway);
CREATE INDEX IF NOT EXISTS idx_mp_transactions_order_id ON public.mp_transactions(order_id);