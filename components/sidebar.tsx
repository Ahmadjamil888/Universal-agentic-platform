'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Bot,
  BarChart3,
  Settings,
  Users,
  Zap,
  Activity,
  Building2,
  UserCheck,
  Plus,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
}

interface Department {
  id: string
  name: string
  description: string | null
}

interface UserRole {
  role: 'owner' | 'admin' | 'department_head' | 'member'
  department_id: string | null
}

export default function Sidebar({ className }: SidebarProps) {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    departments: true,
    agents: true
  })

  const pathname = usePathname()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)

      // Get user's role and organization
      const { data: member } = await supabase
        .from('organization_members')
        .select('role, department_id, organization_id')
        .eq('user_id', user.id)
        .single()

      if (member) {
        setUserRole({
          role: member.role,
          department_id: member.department_id
        })

        // Get departments based on role
        let deptQuery = supabase
          .from('departments')
          .select('id, name, description')
          .eq('organization_id', member.organization_id)

        // If user is not owner/admin, only show their department
        if (member.role === 'member' && member.department_id) {
          deptQuery = deptQuery.eq('id', member.department_id)
        }

        const { data: depts } = await deptQuery
        setDepartments(depts || [])
      }
    }

    getUserData()
  }, [supabase])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const isActive = (path: string) => pathname === path

  const canManageOrganization = userRole?.role === 'owner' || userRole?.role === 'admin'
  const canViewAllDepartments = canManageOrganization
  const userDepartmentOnly = userRole?.role === 'member' && userRole?.department_id

  return (
    <div className={cn("flex h-full w-64 flex-col bg-white border-r", className)}>
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">UAP</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {/* Overview */}
        <div>
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100",
              isActive('/dashboard') && "bg-primary/10 text-primary"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </Link>
        </div>

        {/* Departments Section */}
        <div>
          <button
            onClick={() => toggleSection('departments')}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Departments</span>
            </div>
            {expandedSections.departments ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {expandedSections.departments && (
            <div className="ml-6 mt-1 space-y-1">
              {departments.map((dept) => (
                <Link
                  key={dept.id}
                  href={`/departments/${dept.id}`}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm hover:bg-gray-100",
                    isActive(`/departments/${dept.id}`) && "bg-primary/10 text-primary"
                  )}
                >
                  {dept.name}
                </Link>
              ))}

              {canManageOrganization && (
                <Link
                  href="/departments/create"
                  className="flex items-center space-x-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Department</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Agents Section */}
        <div>
          <button
            onClick={() => toggleSection('agents')}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            <div className="flex items-center space-x-2">
              <Bot className="h-4 w-4" />
              <span>AI Agents</span>
            </div>
            {expandedSections.agents ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {expandedSections.agents && (
            <div className="ml-6 mt-1 space-y-1">
              <Link
                href="/agents"
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm hover:bg-gray-100",
                  isActive('/agents') && "bg-primary/10 text-primary"
                )}
              >
                All Agents
              </Link>

              {departments.map((dept) => (
                <Link
                  key={`agents-${dept.id}`}
                  href={`/departments/${dept.id}/agents`}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm hover:bg-gray-100",
                    isActive(`/departments/${dept.id}/agents`) && "bg-primary/10 text-primary"
                  )}
                >
                  {dept.name} Agents
                </Link>
              ))}

              {!userDepartmentOnly && (
                <Link
                  href="/agents/create"
                  className="flex items-center space-x-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  <Plus className="h-3 w-3" />
                  <span>Create Agent</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Workflows */}
        <div>
          <Link
            href="/workflows"
            className={cn(
              "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100",
              isActive('/workflows') && "bg-primary/10 text-primary"
            )}
          >
            <Zap className="h-4 w-4" />
            <span>Workflows</span>
          </Link>
        </div>

        {/* Analytics */}
        <div>
          <Link
            href="/analytics"
            className={cn(
              "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100",
              isActive('/analytics') && "bg-primary/10 text-primary"
            )}
          >
            <Activity className="h-4 w-4" />
            <span>Analytics</span>
          </Link>
        </div>

        {/* User Management - Only for org owners/admins */}
        {canManageOrganization && (
          <div>
            <Link
              href="/users"
              className={cn(
                "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100",
                isActive('/users') && "bg-primary/10 text-primary"
              )}
            >
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </Link>
          </div>
        )}

        {/* Settings */}
        <div className="pt-4 border-t">
          <Link
            href="/settings"
            className={cn(
              "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100",
              isActive('/settings') && "bg-primary/10 text-primary"
            )}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
