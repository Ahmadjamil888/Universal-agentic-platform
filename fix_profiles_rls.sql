-- Fix RLS policies for profiles to allow viewing profiles of organization members
-- This script should be run in Supabase SQL Editor

-- First, let's check the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Update the RLS policies for profiles to allow viewing profiles of organization members
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

-- Also add a policy for department head access (for viewing department head profiles)
CREATE POLICY "Department members can view department head profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM departments d
      JOIN organization_members om ON d.organization_id = om.organization_id
      WHERE d.head_user_id = profiles.id
      AND om.user_id = auth.uid()
    )
  );

-- Let's also check if we need to update the departments RLS to allow the join
-- The current departments policy should allow viewing departments in their organization
-- But we need to make sure the join with profiles works

-- Test query to make sure it works:
-- SELECT d.*, p.full_name, p.email
-- FROM departments d
-- LEFT JOIN profiles p ON d.head_user_id = p.id
-- WHERE d.organization_id = 'your-org-id';
