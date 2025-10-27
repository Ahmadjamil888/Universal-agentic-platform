'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Plus, BarChart3, Settings, Users, Zap, Activity, Building2, Edit, Users as UsersIcon } from 'lucide-react'
import Link from 'next/link'

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

interface Agent {
  id: string
  name: string
  description: string | null
  model_provider: string
  model_name: string
  created_at: string
}

export default function DepartmentDetailPage() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [department, setDepartment] = useState<Department | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [stats, setStats] = useState({
    activeAgents: 0,
    workflows: 0,
    tasksCompleted: 0,
    timeSaved: 0
  })
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  const router = useRouter()
  const params = useParams()
  const departmentId = params.id as string
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadDepartmentAndData = async () => {
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

      // Check if user has access to this department
      let canAccess = false
      if (member.role === 'owner' || member.role === 'admin') {
        canAccess = true
      } else {
        // Check if user is member of this department
        const { data: deptMember } = await supabase
          .from('department_members')
          .select('id')
          .eq('department_id', departmentId)
          .eq('user_id', user.id)
          .single()

        canAccess = !!deptMember
      }

      if (!canAccess) {
        alert('You do not have access to this department')
        router.push('/departments')
        return
      }

      setHasAccess(true)

      // Load department details
      const { data: dept, error: deptError } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          description,
          head_user_id,
          created_at,
          profiles!head_user_id(
            full_name,
            email
          )
        `)
        .eq('id', departmentId)
        .single()

      if (deptError || !dept) {
        console.error('Error loading department:', deptError)
        router.push('/departments')
        return
      }

      // Get member count
      const { count: memberCount } = await supabase
        .from('department_members')
        .select('id', { count: 'exact' })
        .eq('department_id', departmentId)

      // Get agent count for this department
      const { count: agentCount } = await supabase
        .from('agent_department_associations')
        .select('id', { count: 'exact' })
        .eq('department_id', departmentId)

      setDepartment({
        ...dept,
        head_user: dept.profiles,
        member_count: memberCount || 0,
        agent_count: agentCount || 0
      })

      // Load agents for this department
      const { data: deptAgents } = await supabase
        .from('agent_department_associations')
        .select(`
          agents (
            id,
            name,
            description,
            model_provider,
            model_name,
            created_at
          )
        `)
        .eq('department_id', departmentId)

      const agentList = deptAgents?.map((assoc: any) => assoc.agents).filter(Boolean) || []
      setAgents(agentList)

      // Get usage stats for this department
      const { data: usageLogs } = await supabase
        .from('ai_usage_logs')
        .select('input_tokens, output_tokens, duration_ms')
        .eq('department_id', departmentId)
        .order('created_at', { ascending: false })
        .limit(100)

      // Calculate stats
      const totalTasks = usageLogs?.length || 0
      const totalTimeSaved = usageLogs?.reduce((sum, log) => sum + (log.duration_ms || 0), 0) || 0

      setStats({
        activeAgents: agentList.length,
        workflows: 0, // Workflows are org-level, not dept-specific
        tasksCompleted: totalTasks,
        timeSaved: Math.round(totalTimeSaved / 60000) // Convert ms to minutes
      })

      setLoading(false)
    }

    if (departmentId) {
      loadDepartmentAndData()
    }
  }, [router, supabase, departmentId])

  const canManageDepartment = ['owner', 'admin'].includes(userRole)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!department || !hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-600 mt-2">You don't have permission to view this department.</p>
            <Button onClick={() => router.push('/departments')} className="mt-4">
              Back to Departments
            </Button>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">{department.name}</h1>
            <p className="text-gray-600 mt-1">
              {department.description || 'Department dashboard and management'}
            </p>
          </div>

          {canManageDepartment && (
            <Link href={`/departments/${department.id}/edit`}>
              <Button variant="outline" className="flex items-center space-x-2">
                <Edit className="h-4 w-4" />
                <span>Edit Department</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Department Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Department Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Department Head</p>
                <p className="text-sm text-gray-600">
                  {department.head_user?.full_name || department.head_user?.email || 'Not assigned'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Members</p>
                <p className="text-sm text-gray-600">{department.member_count} members</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">AI Agents</p>
                <p className="text-sm text-gray-600">{department.agent_count} agents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link href={`/departments/${department.id}/agents/create`}>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Agent</span>
              </Button>
            </Link>
            <Link href="/workflows/create">
              <Button variant="outline" className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>New Workflow</span>
              </Button>
            </Link>
            {canManageDepartment && (
              <Link href={`/departments/${department.id}/members`}>
                <Button variant="outline" className="flex items-center space-x-2">
                  <UsersIcon className="h-4 w-4" />
                  <span>Manage Members</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeAgents}</div>
              <p className="text-xs text-muted-foreground">In this department</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workflows</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.workflows}</div>
              <p className="text-xs text-muted-foreground">Available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tasksCompleted}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.timeSaved}min</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agents List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span>AI Agents</span>
              </CardTitle>
              <CardDescription>
                Agents available in this department
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No agents in this department yet</p>
                  <Link href={`/departments/${department.id}/agents/create`} className="mt-4 inline-block">
                    <Button size="sm">Create First Agent</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {agents.slice(0, 5).map((agent) => (
                    <div key={agent.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{agent.name}</h4>
                        <p className="text-sm text-gray-600">{agent.description || 'No description'}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {agent.model_provider}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {agent.model_name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {agents.length > 5 && (
                    <div className="text-center">
                      <Link href={`/departments/${department.id}/agents`}>
                        <Button variant="outline" size="sm">
                          View All Agents ({agents.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Latest actions in this department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">Department created</p>
                    <p className="text-xs text-gray-500">
                      {new Date(department.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {agents.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm">AI agents deployed</p>
                      <p className="text-xs text-gray-500">{agents.length} agents active</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">Team members added</p>
                    <p className="text-xs text-gray-500">{department.member_count} members</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Link href="/analytics">
                  <Button className="w-full">
                    View Full Analytics
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
