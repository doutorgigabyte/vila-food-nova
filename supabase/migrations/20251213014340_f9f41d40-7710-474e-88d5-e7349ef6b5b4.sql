-- Adicionar política para permitir que entregadores vejam seu próprio registro
CREATE POLICY "Drivers can view their own profile"
ON delivery_drivers
FOR SELECT
USING (user_id = auth.uid());

-- Adicionar política para permitir que entregadores atualizem seu próprio registro
CREATE POLICY "Drivers can update their own profile"
ON delivery_drivers
FOR UPDATE
USING (user_id = auth.uid());

-- Super admins podem gerenciar todos os entregadores
CREATE POLICY "Super admins can manage all drivers"
ON delivery_drivers
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));