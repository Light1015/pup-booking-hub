-- Add workflow_status column to track the processing stages
-- Stages: pending_payment, payment_confirmed, scheduled, shooting, processing, editing_complete, delivered, cancelled
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS workflow_status text DEFAULT 'pending_payment';

-- Add timestamps for each workflow stage
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS shooting_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS processing_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS editing_complete_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;

-- Create a function to auto-cancel unpaid bookings after 24 hours
CREATE OR REPLACE FUNCTION public.auto_cancel_unpaid_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.bookings
  SET 
    workflow_status = 'cancelled',
    status = 'cancelled',
    cancelled_at = now()
  WHERE 
    workflow_status = 'pending_payment'
    AND payment_proof_url IS NULL
    AND created_at < now() - interval '24 hours';
END;
$$;

-- Create a function to get booking by phone or email for customer lookup
CREATE OR REPLACE FUNCTION public.get_bookings_by_contact(p_phone text DEFAULT NULL, p_email text DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  booking_date date,
  booking_time text,
  name text,
  phone text,
  email text,
  pet_name text,
  pet_type text,
  notes text,
  status text,
  workflow_status text,
  selected_category text,
  payment_proof_url text,
  created_at timestamp with time zone,
  manage_token uuid,
  payment_confirmed_at timestamp with time zone,
  scheduled_at timestamp with time zone,
  shooting_at timestamp with time zone,
  processing_at timestamp with time zone,
  editing_complete_at timestamp with time zone,
  delivered_at timestamp with time zone,
  cancelled_at timestamp with time zone
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
    b.notes,
    b.status,
    b.workflow_status,
    b.selected_category,
    b.payment_proof_url,
    b.created_at,
    b.manage_token,
    b.payment_confirmed_at,
    b.scheduled_at,
    b.shooting_at,
    b.processing_at,
    b.editing_complete_at,
    b.delivered_at,
    b.cancelled_at
  FROM public.bookings b
  WHERE 
    (p_phone IS NOT NULL AND b.phone = p_phone)
    OR (p_email IS NOT NULL AND b.email = p_email);
$$;