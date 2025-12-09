-- Fix: Remover SECURITY DEFINER da view e recriar como view normal
DROP VIEW IF EXISTS public.establishment_debt_summary;

CREATE VIEW public.establishment_debt_summary AS
SELECT 
  establishment_id,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COALESCE(SUM(total_commission_due) FILTER (WHERE status = 'pending'), 0) as pending_amount,
  COUNT(*) FILTER (WHERE status = 'paid' OR status = 'deducted') as paid_count,
  COALESCE(SUM(total_commission_due) FILTER (WHERE status = 'paid' OR status = 'deducted'), 0) as paid_amount,
  COALESCE(SUM(total_commission_due), 0) as total_amount
FROM public.establishment_commission_debt
GROUP BY establishment_id;

-- Garantir que a view respeita RLS
ALTER VIEW public.establishment_debt_summary SET (security_invoker = on);