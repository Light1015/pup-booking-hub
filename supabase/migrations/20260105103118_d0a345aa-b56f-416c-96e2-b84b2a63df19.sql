-- Fix 1: Remove conflicting storage policy that allows anyone to upload anywhere in gallery bucket
-- Keep only the restricted payment-proof policy
DROP POLICY IF EXISTS "Anyone can upload to gallery" ON storage.objects;

-- Fix 2: Remove broken bookings token policy that exposes ALL bookings
-- The edge function manage-booking handles token validation securely with service role
DROP POLICY IF EXISTS "Users can view bookings with valid token" ON public.bookings;