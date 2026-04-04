-- Allow super admins to manage all coupons
CREATE POLICY "Super admins can manage all coupons"
ON public.coupons
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));