-- Script to ensure all auth users have profiles
-- Run this in Supabase SQL Editor

-- Insert missing profiles for any auth users that don't have them
INSERT INTO profiles (id, email, full_name)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Update any profiles that have null emails
UPDATE profiles
SET email = au.email
FROM auth.users au
WHERE profiles.id = au.id
AND profiles.email IS NULL;

-- Update any profiles that have null full_name but have meta data
UPDATE profiles
SET full_name = COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
FROM auth.users au
WHERE profiles.id = au.id
AND (profiles.full_name IS NULL OR profiles.full_name = '');

-- Check the results
SELECT
  p.id,
  p.email,
  p.full_name,
  au.email as auth_email,
  au.raw_user_meta_data->>'full_name' as meta_full_name
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC;
