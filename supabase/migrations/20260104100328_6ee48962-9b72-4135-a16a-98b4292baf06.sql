-- Fix 1: Add public SELECT policy for site_config
-- This allows unauthenticated users to read bank account info and admin email for booking/contact forms
CREATE POLICY "Config is viewable by everyone"
ON public.site_config
FOR SELECT
USING (true);

-- Fix 2: Fix bookings token validation RLS policy
-- The current validate_booking_token function checks if ANY booking has that token,
-- but doesn't restrict the SELECT to only that specific booking's row.
-- We need to drop the existing policy and create one that filters by the token directly.

DROP POLICY IF EXISTS "Users can view bookings with valid token" ON public.bookings;

-- Create a new policy that directly matches the manage_token
-- This ensures users can only see the specific booking that matches their token
-- The token is passed as a query parameter and matched against manage_token column
CREATE POLICY "Users can view own booking via token"
ON public.bookings
FOR SELECT
USING (
  -- Admins can see all bookings
  has_role(auth.uid(), 'admin'::app_role)
  -- Or the booking's manage_token must match the token being queried
  -- This works because the frontend queries: .eq('manage_token', token)
  -- RLS will filter to only return rows where this condition is true
  OR manage_token IS NOT NULL
);

-- Actually, the above still exposes all bookings with tokens.
-- The correct approach: rely on the query filter .eq('manage_token', token)
-- combined with RLS that allows SELECT only when querying by manage_token.
-- Since Supabase RLS evaluates per-row, we need a different approach.

-- Drop the policy we just created
DROP POLICY IF EXISTS "Users can view own booking via token" ON public.bookings;

-- The safest approach: Only allow SELECT when the manage_token column value
-- is being explicitly matched in the query. Since we can't detect query filters in RLS,
-- we use the approach where the token must be non-null (bookings always have tokens)
-- and the application code filters by token.

-- Actually, the correct fix is to update the validate_booking_token function
-- to check if the current row's manage_token matches the provided token.
-- But RLS policies can't receive external parameters directly.

-- The proper solution: Create a function that checks if this specific row's token
-- is the one being validated. We'll use a different approach:
-- Allow SELECT only via the admin role OR via a service-level lookup.

-- For customer self-service, we'll handle this differently:
-- 1. Remove the problematic policy
-- 2. Create a secure RPC function for token-based lookup

-- Create a secure RPC function for token-based booking lookup
CREATE OR REPLACE FUNCTION public.get_booking_by_token(p_token uuid)
RETURNS TABLE (
  id uuid,
  booking_date date,
  booking_time text,
  name text,
  phone text,
  email text,
  pet_name text,
  pet_type text,
  pet_age text,
  notes text,
  status text,
  selected_category text,
  payment_proof_url text,
  created_at timestamptz,
  manage_token uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    b.id,
    b.booking_date,
    b.booking_time,
    b.name,
    b.phone,
    b.email,
    b.pet_name,
    b.pet_type,
    b.pet_age,
    b.notes,
    b.status,
    b.selected_category,
    b.payment_proof_url,
    b.created_at,
    b.manage_token
  FROM public.bookings b
  WHERE b.manage_token = p_token;
$$;

-- Create RPC function for updating booking by token (for reschedule/cancel)
CREATE OR REPLACE FUNCTION public.update_booking_by_token(
  p_token uuid,
  p_status text DEFAULT NULL,
  p_booking_date date DEFAULT NULL,
  p_booking_time text DEFAULT NULL,
  p_payment_proof_url text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id uuid;
BEGIN
  -- Find the booking with this token
  SELECT id INTO v_booking_id
  FROM public.bookings
  WHERE manage_token = p_token;
  
  IF v_booking_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update only the fields that are provided
  UPDATE public.bookings
  SET
    status = COALESCE(p_status, status),
    booking_date = COALESCE(p_booking_date, booking_date),
    booking_time = COALESCE(p_booking_time, booking_time),
    payment_proof_url = COALESCE(p_payment_proof_url, payment_proof_url)
  WHERE id = v_booking_id;
  
  RETURN true;
END;
$$;