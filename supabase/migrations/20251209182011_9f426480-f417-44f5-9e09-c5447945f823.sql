-- Phase 2: Add recurrence to scheduled_orders
ALTER TABLE scheduled_orders ADD COLUMN IF NOT EXISTS recurrence jsonb;

-- Phase 4: Product Kits
CREATE TABLE IF NOT EXISTS product_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES establishments(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  kit_price numeric NOT NULL,
  original_price numeric,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_kit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid REFERENCES product_kits(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 1,
  is_replaceable boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Phase 5: Product Complements (buy X get Y with discount)
CREATE TABLE IF NOT EXISTS product_complements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  complement_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  discount_percentage numeric DEFAULT 0,
  discount_fixed numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_products CHECK (product_id != complement_id)
);

-- Enable RLS
ALTER TABLE product_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_complements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_kits
CREATE POLICY "Anyone can view active kits" ON product_kits
  FOR SELECT USING (is_active = true);

CREATE POLICY "Establishment owners can manage kits" ON product_kits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM establishments
      WHERE establishments.id = product_kits.establishment_id
      AND establishments.owner_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all kits" ON product_kits
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for product_kit_items
CREATE POLICY "Anyone can view kit items" ON product_kit_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM product_kits
      WHERE product_kits.id = product_kit_items.kit_id
      AND product_kits.is_active = true
    )
  );

CREATE POLICY "Establishment owners can manage kit items" ON product_kit_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM product_kits
      JOIN establishments ON establishments.id = product_kits.establishment_id
      WHERE product_kits.id = product_kit_items.kit_id
      AND establishments.owner_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all kit items" ON product_kit_items
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for product_complements
CREATE POLICY "Anyone can view active complements" ON product_complements
  FOR SELECT USING (is_active = true);

CREATE POLICY "Establishment owners can manage complements" ON product_complements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN establishments ON establishments.id = products.establishment_id
      WHERE products.id = product_complements.product_id
      AND establishments.owner_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all complements" ON product_complements
  FOR ALL USING (has_role(auth.uid(), 'super_admin'));