'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Plus, MoreVertical, Edit, Trash2, Play, Pause } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Agent {
  id: string
  name: string
  description: string | null
  model_provider: string
  model_name: string
  config: any
  created_at: string
  is_active?: boolean
}

interface Department {
  id: string
  name: string
}

export default function DepartmentAgentsPage() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [department, setDepartment] = useState<Department | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  const router = useRouter()
  const params = useParams()
  const departmentId = params.id as string
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadDepartmentAndAgents = async () => {
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
        .select('id, name')
        .eq('id', departmentId)
        .single()

      if (deptError || !dept) {
        console.error('Error loading department:', deptError)
        router.push('/departments')
        return
      }

      setDepartment(dept)

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
            config,
            created_at
          )
        `)
        .eq('department_id', departmentId)

      const agentList = deptAgents?.map((assoc: any) => ({
        ...assoc.agents,
        is_active: assoc.agents?.config?.is_active || false
      })).filter(Boolean) || []

      setAgents(agentList)
      setLoading(false)
    }

    if (departmentId) {
      loadDepartmentAndAgents()
    }
  }, [router, supabase, departmentId])

  const handleToggleAgentStatus = async (agentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ config: { ...agents.find(a => a.id === agentId)?.config, is_active: !currentStatus } })
        .eq('id', agentId)

      if (error) throw error

      // Update local state
      setAgents(agents.map(agent =>
        agent.id === agentId
          ? { ...agent, is_active: !currentStatus }
          : agent
      ))
    } catch (error) {
      console.error('Error toggling agent status:', error)
      alert('Failed to update agent status')
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return
    }

    try {
      // First remove department association
      await supabase
        .from('agent_department_associations')
        .delete()
        .eq('agent_id', agentId)
        .eq('department_id', departmentId)

      // Then delete the agent (if user has permission)
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId)

      if (error) throw error

      // Update local state
      setAgents(agents.filter(a => a.id !== agentId))
    } catch (error) {
      console.error('Error deleting agent:', error)
      alert('Failed to delete agent. Please try again.')
    }
  }

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
            <h1 className="text-3xl font-bold text-gray-900">AI Agents - {department.name}</h1>
            <p className="text-gray-600 mt-1">
              Manage AI agents for this department
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Link href={`/departments/${department.id}`}>
              <Button variant="outline">Back to Department</Button>
            </Link>
            <Link href={`/departments/${department.id}/agents/create`}>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Agent</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Agents Grid */}
        {agents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bot className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
              <p className="text-gray-600 text-center mb-6">
                Get started by creating your first AI agent for this department
              </p>
              <Link href={`/departments/${department.id}/agents/create`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Bot className="h-5 w-5 text-primary" />
                        <span>{agent.name}</span>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {agent.description || 'No description provided'}
                      </CardDescription>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleAgentStatus(agent.id, agent.is_active || false)}>
                          {agent.is_active ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/departments/${department.id}/agents/${agent.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Status and Model Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${agent.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-600">
                          {agent.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <Badge variant="secondary" className="text-xs">
                        {agent.model_provider}
                      </Badge>
                    </div>

                    {/* Model Details */}
                    <div>
                      <p className="text-sm font-medium text-gray-700">Model</p>
                      <p className="text-sm text-gray-600">{agent.model_name}</p>
                    </div>

                    {/* Created Date */}
                    <div>
                      <p className="text-sm font-medium text-gray-700">Created</p>
                      <p className="text-sm text-gray-600">
                        {new Date(agent.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Test Agent
                      </Button>
                      <Button size="sm" className="flex-1">
                        Configure
                      </Button>
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
