-- Phase 4: RLS policies for establishment_users visibility
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own establishment users" ON establishment_users;
DROP POLICY IF EXISTS "Super admin can view all establishment users" ON establishment_users;
DROP POLICY IF EXISTS "Managers can view their establishment users" ON establishment_users;
DROP POLICY IF EXISTS "Users can update their own establishment users" ON establishment_users;
DROP POLICY IF EXISTS "Managers can manage their establishment users" ON establishment_users;

-- Create comprehensive RLS policies for establishment_users

-- Super admin can view all establishment users
CREATE POLICY "Super admin can view all establishment users" ON establishment_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Managers can view users in their establishment
CREATE POLICY "Managers can view their establishment users" ON establishment_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM establishment_users eu 
    WHERE eu.user_id = auth.uid() 
    AND eu.establishment_id = establishment_users.establishment_id 
    AND eu.role = 'manager'
  )
);

-- Super admin can insert establishment users
CREATE POLICY "Super admin can insert establishment users" ON establishment_users
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Managers can insert users in their establishment
CREATE POLICY "Managers can insert their establishment users" ON establishment_users
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM establishment_users eu 
    WHERE eu.user_id = auth.uid() 
    AND eu.establishment_id = establishment_users.establishment_id 
    AND eu.role = 'manager'
  )
);

-- Super admin can update all establishment users
CREATE POLICY "Super admin can update all establishment users" ON establishment_users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Managers can update users in their establishment
CREATE POLICY "Managers can update their establishment users" ON establishment_users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM establishment_users eu 
    WHERE eu.user_id = auth.uid() 
    AND eu.establishment_id = establishment_users.establishment_id 
    AND eu.role = 'manager'
  )
);

-- Super admin can delete establishment users
CREATE POLICY "Super admin can delete establishment users" ON establishment_users
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Managers can delete users in their establishment (except themselves)
CREATE POLICY "Managers can delete their establishment users" ON establishment_users
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM establishment_users eu 
    WHERE eu.user_id = auth.uid() 
    AND eu.establishment_id = establishment_users.establishment_id 
    AND eu.role = 'manager'
  )
  AND user_id != auth.uid()
);

-- Phase 5: Add roadmap items for tracking
INSERT INTO roadmap_items (title, description, category, priority, status, estimated_hours) VALUES
('Toast e Sonner sempre no topo', 'Mover notificações toast para o topo da tela para não conflitar com navegação mobile', 'validation', 'P1', 'done', 1),
('Avatar usuário logado visível no mobile', 'Melhorar visibilidade do avatar do usuário no header mobile com iniciais e borda', 'validation', 'P1', 'done', 1),
('Badge Super Admin sem quebra de texto', 'Adicionar whitespace-nowrap nos badges de role para evitar quebra de linha', 'validation', 'P1', 'done', 0.5),
('Responsividade painéis Admin/Dashboard mobile', 'Corrigir overflow horizontal nos painéis administrativos em dispositivos móveis', 'validation', 'P2', 'done', 2),
('Gestão de colaboradores (TeamManagement)', 'Página completa para gerenciar equipe do estabelecimento com criação, edição e remoção de colaboradores', 'admin', 'P1', 'done', 5),
('RLS para visibilidade equipe Admin vs Loja', 'Policies de segurança para garantir que donos de loja vejam apenas seus colaboradores', 'admin', 'P2', 'done', 1)
ON CONFLICT DO NOTHING;