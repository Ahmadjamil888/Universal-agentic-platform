-- Complete fix for head user display issues
-- Run this script in Supabase SQL Editor

-- ==========================================
-- STEP 1: Fix RLS policies for profiles
-- ==========================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Allow users to view profiles of people in their organizations
CREATE POLICY "Users can view profiles in their organizations" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM organization_members om1
      WHERE om1.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM organization_members om2
        WHERE om2.organization_id = om1.organization_id
        AND om2.user_id = profiles.id
      )
    )
  );

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ==========================================
-- STEP 2: Ensure all auth users have profiles
-- ==========================================

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

-- ==========================================
-- STEP 3: Fix department head_user_id references
-- ==========================================

-- Update departments with invalid head_user_id to point to organization owner
UPDATE departments
SET head_user_id = om.user_id
FROM organization_members om
WHERE departments.organization_id = om.organization_id
AND om.role = 'owner'
AND departments.head_user_id NOT IN (SELECT id FROM profiles);

-- ==========================================
-- STEP 4: Verification queries
-- ==========================================

-- Check that all departments have valid head users
SELECT
  'Department head check' as check_type,
  COUNT(*) as total_departments,
  COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as valid_heads,
  COUNT(CASE WHEN p.id IS NULL THEN 1 END) as invalid_heads
FROM departments d
LEFT JOIN profiles p ON d.head_user_id = p.id;

-- Check that all organization members have profiles
SELECT
  'Organization member profile check' as check_type,
  COUNT(*) as total_members,
  COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as have_profiles,
  COUNT(CASE WHEN p.id IS NULL THEN 1 END) as missing_profiles
FROM organization_members om
LEFT JOIN profiles p ON om.user_id = p.id;

-- Show sample department with head user info
SELECT
  d.id,
  d.name,
  d.head_user_id,
  p.full_name,
  p.email,
  om.role as head_org_role
FROM departments d
LEFT JOIN profiles p ON d.head_user_id = p.id
LEFT JOIN organization_members om ON d.head_user_id = om.user_id AND d.organization_id = om.organization_id
ORDER BY d.created_at DESC
LIMIT 5;
