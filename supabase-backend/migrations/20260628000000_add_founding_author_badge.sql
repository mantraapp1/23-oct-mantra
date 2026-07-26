-- Migration: Add founding_author_number to profiles table
-- Timestamp: 20260628000000

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS founding_author_number INTEGER CHECK (founding_author_number >= 1 AND founding_author_number <= 108);

-- Add unique constraint to ensure no duplicate founding author numbers are assigned
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_founding_author_number UNIQUE (founding_author_number);

-- Allow admins to update profiles (needed for assigning badges and verification)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Allow admins to delete profiles
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile" 
ON public.profiles FOR DELETE 
TO authenticated 
USING (is_admin(auth.uid()));
