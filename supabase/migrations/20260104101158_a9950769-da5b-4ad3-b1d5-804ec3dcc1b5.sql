-- Create table to store album likes (aggregate count and anonymous tracking)
CREATE TABLE public.album_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.photo_albums(id) ON DELETE CASCADE,
  like_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(album_id)
);

-- Enable RLS
ALTER TABLE public.album_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view like counts
CREATE POLICY "Like counts are viewable by everyone"
ON public.album_likes
FOR SELECT
USING (true);

-- Anyone can increment likes (we'll handle this via RPC to prevent abuse)
CREATE POLICY "Anyone can update like counts"
ON public.album_likes
FOR UPDATE
USING (true);

-- Anyone can insert initial like counts
CREATE POLICY "Anyone can insert like counts"
ON public.album_likes
FOR INSERT
WITH CHECK (true);

-- Create function to toggle like (increment/decrement)
CREATE OR REPLACE FUNCTION public.toggle_album_like(p_album_id uuid, p_increment boolean)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_count integer;
BEGIN
  -- Insert if not exists
  INSERT INTO public.album_likes (album_id, like_count)
  VALUES (p_album_id, 0)
  ON CONFLICT (album_id) DO NOTHING;
  
  -- Update the count
  IF p_increment THEN
    UPDATE public.album_likes 
    SET like_count = GREATEST(0, like_count + 1), updated_at = now()
    WHERE album_id = p_album_id
    RETURNING like_count INTO v_new_count;
  ELSE
    UPDATE public.album_likes 
    SET like_count = GREATEST(0, like_count - 1), updated_at = now()
    WHERE album_id = p_album_id
    RETURNING like_count INTO v_new_count;
  END IF;
  
  RETURN COALESCE(v_new_count, 0);
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_album_likes_updated_at
BEFORE UPDATE ON public.album_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();