-- Fix: The "Anyone can create bookings" policy exists but is RESTRICTIVE instead of PERMISSIVE
-- Drop the existing restrictive policy and recreate as permissive

DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

CREATE POLICY "Anyone can create bookings"
ON public.bookings
FOR INSERT
TO public
WITH CHECK (true);

-- Also need to add a public SELECT policy for the booking lookup by token feature
-- This uses a security definer function validate_booking_token that already exists
CREATE POLICY "Users can view bookings with valid token"
ON public.bookings
FOR SELECT
USING (
  validate_booking_token(manage_token)
);