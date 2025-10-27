'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Plus, BarChart3, Settings, Users, Zap, Activity, Building2 } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    activeAgents: 0,
    workflows: 0,
    tasksCompleted: 0,
    timeSaved: 0
  })
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUserAndStats = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Get user's organization
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single()

      if (member) {
        // Get stats based on user's access level
        const orgId = member.organization_id
        const isAdmin = member.role === 'owner' || member.role === 'admin'

        let agentQuery: any = supabase
          .from('agents')
          .select('id', { count: 'exact' })
          .eq('organization_id', orgId)

        let workflowQuery = supabase
          .from('workflows')
          .select('id', { count: 'exact' })
          .eq('organization_id', orgId)

        // If not admin, only show agents and workflows for user's departments
        if (!isAdmin) {
          const { data: userDepts } = await supabase
            .from('department_members')
            .select('department_id')
            .eq('user_id', user.id)

          if (userDepts && userDepts.length > 0) {
            const deptIds = userDepts.map(d => d.department_id)

            agentQuery = supabase
              .from('agent_department_associations')
              .select('agent_id', { count: 'exact' })
              .in('department_id', deptIds)

            workflowQuery = workflowQuery
              .eq('organization_id', orgId) // Keep org-level workflows for now
          }
        }

        const [agentResult, workflowResult] = await Promise.all([
          agentQuery,
          workflowQuery
        ])

        setStats({
          activeAgents: agentResult.count || 0,
          workflows: workflowResult.count || 0,
          tasksCompleted: 1247, // This would come from ai_usage_logs
          timeSaved: 42 // This would be calculated
        })
      }
    }

    getUserAndStats()
  }, [router, supabase])

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your AI agents.</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/agents/create">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Agent</span>
              </Button>
            </Link>
            <Link href="/workflows/create">
              <Button className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>New Workflow</span>
              </Button>
            </Link>
            <Link href="/departments/create">
              <Button className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>Add Department</span>
              </Button>
            </Link>
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
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workflows</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.workflows}</div>
              <p className="text-xs text-muted-foreground">+4 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tasksCompleted}</div>
              <p className="text-xs text-muted-foreground">+18% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.timeSaved}h</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Latest actions from your AI agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">Customer Support Bot resolved 5 tickets</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">Email Processor categorized 23 emails</p>
                    <p className="text-xs text-gray-500">15 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">New workflow "Lead Qualification" created</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">Data Analyzer completed monthly report</p>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Link href="/analytics">
                  <Button variant="outline" className="w-full">
                    View All Analytics
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
              <CardDescription>
                Get the most out of your AI platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Create Your First Agent</h4>
                    <p className="text-sm text-gray-600">Set up an AI agent for your department</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Build Workflows</h4>
                    <p className="text-sm text-gray-600">Automate processes with AI workflows</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Manage Team Access</h4>
                    <p className="text-sm text-gray-600">Control who can access what</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
