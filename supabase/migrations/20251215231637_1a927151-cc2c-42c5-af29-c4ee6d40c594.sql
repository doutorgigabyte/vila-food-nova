-- Fix categories RLS: treat NULL is_active as active for team members

DROP POLICY IF EXISTS "Establishment members can manage categories" ON public.categories;

CREATE POLICY "Establishment members can manage categories"
ON public.categories
FOR ALL
USING (
  EXISTS (
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
  EXISTS (
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