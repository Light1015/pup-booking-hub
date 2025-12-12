-- Add price column to photo_albums table
ALTER TABLE public.photo_albums ADD COLUMN IF NOT EXISTS price text DEFAULT NULL;