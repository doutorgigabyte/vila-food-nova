
-- Create expenses table for expense reports
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  description text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  receipt_url text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for expenses
CREATE POLICY "Establishments can manage their expenses"
ON public.expenses FOR ALL
USING (EXISTS (
  SELECT 1 FROM establishments 
  WHERE establishments.id = expenses.establishment_id 
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all expenses"
ON public.expenses FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create disbursement_reports table for tracking payouts
CREATE TABLE IF NOT EXISTS public.disbursement_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE,
  report_type text NOT NULL, -- 'driver', 'affiliate', 'platform'
  recipient_id uuid,
  recipient_name text,
  recipient_type text, -- 'driver', 'affiliate', 'establishment'
  amount numeric NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  payment_method text,
  payment_reference text,
  status text DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on disbursement_reports
ALTER TABLE public.disbursement_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for disbursement_reports
CREATE POLICY "Establishments can view their disbursements"
ON public.disbursement_reports FOR SELECT
USING (EXISTS (
  SELECT 1 FROM establishments 
  WHERE establishments.id = disbursement_reports.establishment_id 
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all disbursements"
ON public.disbursement_reports FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_expenses_establishment ON public.expenses(establishment_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_disbursement_reports_establishment ON public.disbursement_reports(establishment_id);
CREATE INDEX IF NOT EXISTS idx_disbursement_reports_period ON public.disbursement_reports(period_start, period_end);
