'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Plus, MoreVertical, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Department {
  id: string
  name: string
  description: string | null
  head_user_id: string
  created_at: string
  head_user?: {
    full_name: string | null
    email: string
  }
  member_count?: number
  agent_count?: number
}

export default function DepartmentsPage() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadDepartments = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Get user's organization and role
      const { data: member } = await supabase
        .from('organization_members')
        .select('role, organization_id')
        .eq('user_id', user.id)
        .single()

      if (!member) {
        router.push('/organization/setup')
        return
      }

      setUserRole(member.role)

      // Get departments based on role
      let deptQuery = supabase
        .from('departments')
        .select(`
          id,
          name,
          description,
          head_user_id,
          created_at,
          profiles:head_user_id (
            full_name,
            email
          )
        `)
        .eq('organization_id', member.organization_id)

      // If user is not owner/admin, only show their department
      if (member.role === 'member') {
        const { data: userDepts } = await supabase
          .from('department_members')
          .select('department_id')
          .eq('user_id', user.id)

        if (userDepts && userDepts.length > 0) {
          deptQuery = deptQuery.in('id', userDepts.map(d => d.department_id))
        }
      }

      const { data: depts, error } = await deptQuery
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading departments:', error)
        return
      }

      // Get member and agent counts for each department
      const departmentsWithCounts = await Promise.all(
        (depts || []).map(async (dept: any) => {
          const [memberCount, agentCount] = await Promise.all([
            supabase
              .from('department_members')
              .select('id', { count: 'exact' })
              .eq('department_id', dept.id),
            supabase
              .from('agent_department_associations')
              .select('id', { count: 'exact' })
              .eq('department_id', dept.id)
          ])

          return {
            ...dept,
            head_user: dept.profiles,
            member_count: memberCount.count || 0,
            agent_count: agentCount.count || 0
          }
        })
      )

      setDepartments(departmentsWithCounts)
      setLoading(false)
    }

    loadDepartments()
  }, [router, supabase])

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId)

      if (error) throw error

      // Refresh departments list
      setDepartments(departments.filter(d => d.id !== departmentId))
    } catch (error) {
      console.error('Error deleting department:', error)
      alert('Failed to delete department. Please try again.')
    }
  }

  const canManageDepartments = ['owner', 'admin'].includes(userRole)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
            <p className="text-gray-600 mt-1">
              {canManageDepartments
                ? 'Manage departments and their AI resources'
                : 'View your department and AI resources'
              }
            </p>
          </div>

          {canManageDepartments && (
            <Link href="/departments/create">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Department</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Departments Grid */}
        {departments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
              <p className="text-gray-600 text-center mb-6">
                {canManageDepartments
                  ? 'Get started by creating your first department'
                  : 'No departments are currently assigned to you'
                }
              </p>
              {canManageDepartments && (
                <Link href="/departments/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Department
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((department) => (
              <Card key={department.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{department.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {department.description || 'No description provided'}
                      </CardDescription>
                    </div>

                    {canManageDepartments && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/departments/${department.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/departments/${department.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteDepartment(department.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Department Head */}
                    <div>
                      <p className="text-sm font-medium text-gray-700">Department Head</p>
                      <p className="text-sm text-gray-600">
                        {department.head_user?.full_name || department.head_user?.email || 'Not assigned'}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{department.member_count} members</span>
                      </div>

                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Building2 className="h-3 w-3" />
                        <span>{department.agent_count} agents</span>
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Link href={`/departments/${department.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>

                      <Link href={`/departments/${department.id}/agents`}>
                        <Button size="sm" variant="outline">
                          Manage AI
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
