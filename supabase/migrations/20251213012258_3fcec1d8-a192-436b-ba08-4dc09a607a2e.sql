-- Remover política antiga
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Política de INSERT para usuários autenticados
CREATE POLICY "Authenticated users can insert notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Remover política de update antiga se existir
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Política de SELECT
CREATE POLICY "Users can view their notifications"
ON notifications
FOR SELECT
USING (
  user_id = auth.uid()
  OR
  (establishment_id IN (
    SELECT eu.establishment_id 
    FROM establishment_users eu 
    WHERE eu.user_id = auth.uid() AND eu.is_active = true
  ))
  OR
  EXISTS (
    SELECT 1 FROM establishments e 
    WHERE e.id = notifications.establishment_id AND e.owner_id = auth.uid()
  )
  OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Política de UPDATE
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  (establishment_id IN (
    SELECT eu.establishment_id 
    FROM establishment_users eu 
    WHERE eu.user_id = auth.uid() AND eu.is_active = true
  ))
  OR
  has_role(auth.uid(), 'super_admin'::app_role)
);