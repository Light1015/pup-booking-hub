-- Add image columns for packages in services table
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS package_1_image_url TEXT,
ADD COLUMN IF NOT EXISTS package_2_image_url TEXT;