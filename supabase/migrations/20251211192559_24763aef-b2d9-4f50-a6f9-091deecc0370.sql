-- Add affiliate referral tracking to customers
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS referred_by_affiliate_id UUID REFERENCES public.affiliates(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_customers_referred_by ON public.customers(referred_by_affiliate_id);

-- Allow affiliates to see customers they referred
CREATE POLICY "Affiliates can view their referred customers"
ON public.customers
FOR SELECT
TO authenticated
USING (
  referred_by_affiliate_id IN (
    SELECT id FROM public.affiliates WHERE user_id = auth.uid()
  )
);