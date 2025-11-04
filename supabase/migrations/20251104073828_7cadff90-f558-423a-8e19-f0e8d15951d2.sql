-- Add image_urls column to gallery_categories table to support multiple images
ALTER TABLE public.gallery_categories 
ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT ARRAY[]::text[];

-- Update existing categories to migrate single image_url to image_urls array
UPDATE public.gallery_categories 
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND (image_urls IS NULL OR array_length(image_urls, 1) IS NULL);
