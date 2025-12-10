-- Remove the foreign key constraint that references customers table
-- customer_id should be optional and store the user id directly without FK
ALTER TABLE public.scheduled_orders 
DROP CONSTRAINT scheduled_orders_customer_id_fkey;