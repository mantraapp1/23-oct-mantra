/*
  # Fix storage configuration

  1. Changes
    - Drop existing storage policies
    - Recreate storage buckets with correct configuration
    - Add new storage policies with proper access control
  
  2. Security
    - Enable public access for viewing files
    - Restrict upload/update to authenticated users
*/

-- Recreate storage buckets with proper configuration
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('novel_covers', 'Novel Covers', true),
  ('profile_pictures', 'Profile Pictures', true)
ON CONFLICT (id) DO UPDATE 
SET public = true;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Novel covers are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Authors can upload novel covers" ON storage.objects;
DROP POLICY IF EXISTS "Authors can update novel covers" ON storage.objects;
DROP POLICY IF EXISTS "Public profile pictures are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile picture" ON storage.objects;

-- Create new storage policies
-- Novel covers policies
CREATE POLICY "Novel covers are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'novel_covers');

CREATE POLICY "Authenticated users can upload novel covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'novel_covers' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update novel covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'novel_covers' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete novel covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'novel_covers' AND
  auth.role() = 'authenticated'
);

-- Profile pictures policies
CREATE POLICY "Profile pictures are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_pictures');

CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile_pictures' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update profile pictures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile_pictures' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete profile pictures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile_pictures' AND
  auth.role() = 'authenticated'
);