-- Fix: User Email Addresses Publicly Accessible
-- Drop the overly permissive policy that exposes PII
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create owner-only policy - users can only view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Allow admins to view all profiles for admin dashboard functionality
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));