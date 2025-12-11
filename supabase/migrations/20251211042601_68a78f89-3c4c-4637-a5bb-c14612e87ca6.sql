-- Create photo_albums table for managing albums within categories
CREATE TABLE public.photo_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.gallery_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.photo_albums ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Albums are viewable by everyone" ON public.photo_albums FOR SELECT USING (true);
CREATE POLICY "Admins can manage albums" ON public.photo_albums FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add selected_category to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS selected_category TEXT;

-- Update trigger for photo_albums
CREATE TRIGGER update_photo_albums_updated_at
BEFORE UPDATE ON public.photo_albums
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();