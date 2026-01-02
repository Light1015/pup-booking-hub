-- Add payment_proof_url column to bookings table
ALTER TABLE public.bookings ADD COLUMN payment_proof_url text;

-- Add bank transfer configuration to site_config
INSERT INTO public.site_config (key, value) VALUES 
  ('bank_account_name', 'SnapPup Studio'),
  ('bank_account_number', '19031267227016'),
  ('bank_name', 'Techcombank - Chi nhánh Phú Mỹ Hưng'),
  ('bank_qr_url', '')
ON CONFLICT (key) DO NOTHING;