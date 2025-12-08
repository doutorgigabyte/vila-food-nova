-- Adicionar política RLS para permitir que admins gerenciem cupons
-- Isso corrige o erro ao criar cupom no Admin

-- Adicionar política para admins gerenciarem todos os cupons
CREATE POLICY "Admins can manage all coupons" 
ON public.coupons 
FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'));

