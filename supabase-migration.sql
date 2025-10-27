-- Organization Management System Migration
-- Run this in your Supabase SQL Editor

-- Add department_id to organization_members
ALTER TABLE organization_members
ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Update organization_members role to be more specific
ALTER TABLE organization_members
DROP COLUMN role,
ADD COLUMN role TEXT CHECK (role IN ('owner', 'admin', 'department_head', 'member')) DEFAULT 'member';

-- Create departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  head_user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create department_members table
CREATE TABLE department_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('head', 'member')) DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(department_id, user_id)
);

-- Create agent_department_associations table
CREATE TABLE agent_department_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(agent_id, department_id)
);

-- Create ai_usage_logs table
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX idx_organization_members_department_id ON organization_members(department_id);
CREATE INDEX idx_departments_organization_id ON departments(organization_id);
CREATE INDEX idx_department_members_department_id ON department_members(department_id);
CREATE INDEX idx_department_members_user_id ON department_members(user_id);
CREATE INDEX idx_agent_department_associations_agent_id ON agent_department_associations(agent_id);
CREATE INDEX idx_agent_department_associations_department_id ON agent_department_associations(department_id);
CREATE INDEX idx_ai_usage_logs_agent_id ON ai_usage_logs(agent_id);
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_department_id ON ai_usage_logs(department_id);

-- Enable RLS (Row Level Security)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_department_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they are members of" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organization owners and admins can update organizations" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization owners can delete organizations" ON organizations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id AND user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS Policies for organization_members
CREATE POLICY "Users can view members in their organizations" ON organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join organizations or be added by admins" ON organization_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can update their own membership or admins can update" ON organization_members
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can leave organizations or admins can remove members" ON organization_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for departments
CREATE POLICY "Users can view departments in their organization" ON departments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners and admins can manage departments" ON departments
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for department_members
CREATE POLICY "Users can view department members in their organization" ON department_members
  FOR SELECT USING (
    department_id IN (
      SELECT d.id FROM departments d
      JOIN organization_members om ON d.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Department heads and org admins can manage department members" ON department_members
  FOR ALL USING (
    department_id IN (
      SELECT d.id FROM departments d
      JOIN organization_members om ON d.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND (om.role IN ('owner', 'admin') OR d.head_user_id = auth.uid())
    )
  );

-- RLS Policies for agent_department_associations
CREATE POLICY "Users can view agent associations in their organization/department" ON agent_department_associations
  FOR SELECT USING (
    department_id IN (
      SELECT d.id FROM departments d
      JOIN organization_members om ON d.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    ) OR department_id IS NULL
  );

CREATE POLICY "Department members can manage their agent associations" ON agent_department_associations
  FOR ALL USING (
    department_id IN (
      SELECT d.id FROM departments d
      JOIN organization_members om ON d.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- RLS Policies for ai_usage_logs
CREATE POLICY "Users can view usage logs for their department" ON ai_usage_logs
  FOR SELECT USING (
    department_id IN (
      SELECT d.id FROM departments d
      JOIN organization_members om ON d.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert usage logs" ON ai_usage_logs
  FOR INSERT WITH CHECK (true);
