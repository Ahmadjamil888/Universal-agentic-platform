-- Script to check and fix department head_user_id references
-- Run this in Supabase SQL Editor

-- First, check for any departments with head_user_id that don't have corresponding profiles
SELECT
  d.id as department_id,
  d.name as department_name,
  d.head_user_id,
  p.id as profile_exists,
  om.role as org_role
FROM departments d
LEFT JOIN profiles p ON d.head_user_id = p.id
LEFT JOIN organization_members om ON d.head_user_id = om.user_id AND d.organization_id = om.organization_id
ORDER BY d.created_at DESC;

-- Find valid candidates for department heads (organization admins/owners)
SELECT
  om.organization_id,
  om.user_id,
  p.full_name,
  p.email,
  om.role
FROM organization_members om
JOIN profiles p ON om.user_id = p.id
WHERE om.role IN ('owner', 'admin')
ORDER BY om.organization_id, om.role DESC;

-- If there are departments with missing head profiles, you can update them with a valid admin:
-- UPDATE departments
-- SET head_user_id = 'valid-admin-user-id'
-- WHERE id = 'department-id' AND head_user_id NOT IN (SELECT id FROM profiles);

-- Alternative: Set head_user_id to the organization owner
UPDATE departments
SET head_user_id = om.user_id
FROM organization_members om
WHERE departments.organization_id = om.organization_id
AND om.role = 'owner'
AND departments.head_user_id NOT IN (SELECT id FROM profiles);
