-- Drop the overly permissive policy and create a proper one
DROP POLICY IF EXISTS "Public can view booking with valid token" ON public.bookings;

-- Create a function to validate booking access by token
CREATE OR REPLACE FUNCTION public.validate_booking_token(booking_token uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings WHERE manage_token = booking_token
  );
$$;