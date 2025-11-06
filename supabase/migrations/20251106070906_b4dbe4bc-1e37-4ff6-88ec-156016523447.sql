-- Create admin replies history table
CREATE TABLE public.admin_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('booking', 'contact')),
  reference_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_replies ENABLE ROW LEVEL SECURITY;

-- Admins can view all replies
CREATE POLICY "Admins can view all replies"
ON public.admin_replies
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert replies
CREATE POLICY "Admins can insert replies"
ON public.admin_replies
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update bookings table to track read status
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE;

-- Update contacts table to track read status
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX idx_bookings_date_time ON public.bookings(booking_date, booking_time);
CREATE INDEX idx_admin_replies_reference ON public.admin_replies(reference_type, reference_id);