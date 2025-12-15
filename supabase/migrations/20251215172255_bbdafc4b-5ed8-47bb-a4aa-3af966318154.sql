-- Create trigger to log order status changes to audit_logs
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (
      entity_type,
      entity_id,
      action,
      user_id,
      old_data,
      new_data
    ) VALUES (
      'order',
      NEW.id,
      'status_change',
      auth.uid(),
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_log_order_status ON orders;
CREATE TRIGGER trigger_log_order_status
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Add RLS policy to allow viewing order audit logs
CREATE POLICY "Establishments can view order audit logs"
ON audit_logs FOR SELECT
USING (
  entity_type = 'order' AND 
  EXISTS (
    SELECT 1 FROM orders o
    JOIN establishments e ON e.id = o.establishment_id
    WHERE o.id = audit_logs.entity_id AND e.owner_id = auth.uid()
  )
);