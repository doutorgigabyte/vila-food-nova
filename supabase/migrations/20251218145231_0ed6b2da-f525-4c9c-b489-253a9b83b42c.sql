-- Fase 3: Sistema de Agendamento de Serviços

-- 1. Adicionar campo de preço sob consulta nos produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_on_request BOOLEAN DEFAULT false;

-- 2. Adicionar campo de variante de localização (profissional vai até cliente, cliente vai até profissional, ou ambos)
ALTER TABLE products ADD COLUMN IF NOT EXISTS service_location_type TEXT DEFAULT 'store'; -- 'store', 'customer', 'both'

-- 3. Disponibilidade semanal do estabelecimento/profissional
CREATE TABLE IF NOT EXISTS service_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Dom, 1=Seg, ..., 6=Sab
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER DEFAULT 60, -- duração em minutos
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(establishment_id, day_of_week)
);

-- 4. Agendamentos/Reservas
CREATE TABLE IF NOT EXISTS service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  end_time TIME NOT NULL,
  service_location TEXT NOT NULL DEFAULT 'store', -- 'store', 'customer'
  customer_address TEXT, -- se location = 'customer'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  price NUMERIC,
  google_event_id TEXT, -- para integração Google Agenda
  whatsapp_reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT
);

-- 5. Bloqueios de horário (férias, feriados, etc.)
CREATE TABLE IF NOT EXISTS service_blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  start_time TIME, -- NULL = dia inteiro bloqueado
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Credenciais Google Agenda (opcional) no establishments
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS google_calendar_token JSONB;

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_service_availability_establishment ON service_availability(establishment_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_establishment ON service_bookings(establishment_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_date ON service_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_service_blocked_slots_establishment ON service_blocked_slots(establishment_id);
CREATE INDEX IF NOT EXISTS idx_service_blocked_slots_date ON service_blocked_slots(blocked_date);

-- 8. RLS Policies
ALTER TABLE service_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_blocked_slots ENABLE ROW LEVEL SECURITY;

-- Políticas para service_availability
CREATE POLICY "Establishment owners can manage availability"
ON service_availability FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishments e
    WHERE e.id = service_availability.establishment_id
    AND e.owner_id = auth.uid()
  )
);

CREATE POLICY "Public can view active availability"
ON service_availability FOR SELECT
USING (is_active = true);

-- Políticas para service_bookings
CREATE POLICY "Establishment owners can manage bookings"
ON service_bookings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishments e
    WHERE e.id = service_bookings.establishment_id
    AND e.owner_id = auth.uid()
  )
);

CREATE POLICY "Customers can view their own bookings"
ON service_bookings FOR SELECT
USING (customer_id = auth.uid());

CREATE POLICY "Authenticated users can create bookings"
ON service_bookings FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Políticas para service_blocked_slots
CREATE POLICY "Establishment owners can manage blocked slots"
ON service_blocked_slots FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishments e
    WHERE e.id = service_blocked_slots.establishment_id
    AND e.owner_id = auth.uid()
  )
);

CREATE POLICY "Public can view blocked slots"
ON service_blocked_slots FOR SELECT
USING (true);