-- Fix: Remove overly permissive RLS policies that bypass toggle_album_like RPC
-- All modifications must go through the SECURITY DEFINER function

-- Drop the policies that allow anyone to directly manipulate like counts
DROP POLICY IF EXISTS "Anyone can update like counts" ON public.album_likes;
DROP POLICY IF EXISTS "Anyone can insert like counts" ON public.album_likes;

-- Keep only the SELECT policy for reading like counts
-- The toggle_album_like() RPC uses SECURITY DEFINER so it bypasses RLS
-- This forces all modifications through the controlled RPC function