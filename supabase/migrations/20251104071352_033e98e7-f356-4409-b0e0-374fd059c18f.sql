-- Add RLS policies for storage bucket 'gallery'
-- Only admins can upload to gallery
CREATE POLICY "Admins can upload to gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can delete from gallery
CREATE POLICY "Admins can delete from gallery"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can update gallery files
CREATE POLICY "Admins can update gallery"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Everyone can view gallery (already public bucket)
CREATE POLICY "Anyone can view gallery"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

-- Add file size limit and allowed MIME types
UPDATE storage.buckets
SET 
  file_size_limit = 5242880, -- 5MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
WHERE id = 'gallery';