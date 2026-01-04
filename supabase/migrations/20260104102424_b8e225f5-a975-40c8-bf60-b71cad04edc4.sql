-- Fix storage policies for gallery bucket to allow uploads
-- First, drop existing policies if any
DROP POLICY IF EXISTS "Anyone can upload to gallery" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update gallery images" ON storage.objects;

-- Create policy to allow anyone to upload to gallery bucket
CREATE POLICY "Anyone can upload to gallery"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'gallery');

-- Create policy to allow anyone to view gallery images
CREATE POLICY "Anyone can view gallery images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'gallery');

-- Create policy to allow admins to update gallery images
CREATE POLICY "Admins can update gallery images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'));

-- Create policy to allow admins to delete gallery images
CREATE POLICY "Admins can delete gallery images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'));