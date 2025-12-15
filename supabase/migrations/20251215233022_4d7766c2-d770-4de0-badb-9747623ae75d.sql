-- Allow platform admins/super-admins to manage establishment categories

DROP POLICY IF EXISTS "Establishment members can manage categories" ON public.categories;

CREATE POLICY "Establishment members can manage categories"
ON public.categories
FOR ALL
USING (
  public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.establishments e
    WHERE e.id = categories.establishment_id
      AND (
        e.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.establishment_users eu
          WHERE eu.establishment_id = e.id
            AND eu.user_id = auth.uid()
            AND eu.is_active IS DISTINCT FROM false
        )
      )
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin')
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.establishments e
    WHERE e.id = categories.establishment_id
      AND (
        e.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.establishment_users eu
          WHERE eu.establishment_id = e.id
            AND eu.user_id = auth.uid()
            AND eu.is_active IS DISTINCT FROM false
        )
      )
  )
);