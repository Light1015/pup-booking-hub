-- Fix: contacts table needs explicit SELECT policy (currently has no SELECT policy)
-- Note: Checking existing policies first - the table has RLS enabled and INSERT public, UPDATE/DELETE admin-only
-- We need to add SELECT policy for admins

-- First verify the policy doesn't already exist, then create it
DO $$
BEGIN
    -- Drop if exists to avoid conflicts
    DROP POLICY IF EXISTS "Admins can view all contacts" ON public.contacts;
END $$;

CREATE POLICY "Admins can view all contacts"
ON public.contacts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));