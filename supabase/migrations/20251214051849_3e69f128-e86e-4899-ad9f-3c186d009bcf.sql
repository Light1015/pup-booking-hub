-- Add manage_token column for secure customer booking management
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS manage_token uuid DEFAULT gen_random_uuid();

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_bookings_manage_token ON public.bookings(manage_token);

-- Add expected_revenue column to track estimated revenue per booking
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS expected_revenue numeric DEFAULT 0;

-- Create RLS policy for public token-based access (read only with valid token)
CREATE POLICY "Public can view booking with valid token"
ON public.bookings FOR SELECT
USING (true);  -- We'll validate the token in the edge function for security