-- Add policy for anyone to upload payment proof only
DROP POLICY IF EXISTS "Anyone can upload payment proof" ON storage.objects;

CREATE POLICY "Anyone can upload payment proof"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery' AND 
  (storage.foldername(name))[1] = 'payment-proof'
);