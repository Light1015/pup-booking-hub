
-- Add actual_revenue column for admin to input real revenue per booking
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS actual_revenue numeric DEFAULT NULL;
