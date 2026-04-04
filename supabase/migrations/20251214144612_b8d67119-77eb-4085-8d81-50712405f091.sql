-- Add UPDATE policy for customers table
CREATE POLICY "Users can update own customer data"
ON public.customers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add DELETE policy for customers table
CREATE POLICY "Users can delete own customer record"
ON public.customers
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Add DELETE policy for profiles table
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Add DELETE policy for notifications table
CREATE POLICY "Users can delete their notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_role(auth.uid(), 'super_admin'::app_role)
);