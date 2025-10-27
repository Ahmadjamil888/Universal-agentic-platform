'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Department {
  id: string
  name: string
  organization_id: string
}

export default function CreateDepartmentAgentPage() {
  const [agentName, setAgentName] = useState('')
  const [description, setDescription] = useState('')
  const [modelProvider, setModelProvider] = useState('gemini')
  const [modelName, setModelName] = useState('gemini-pro')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [department, setDepartment] = useState<Department | null>(null)
  const [hasAccess, setHasAccess] = useState(false)

  const router = useRouter()
  const params = useParams()
  const departmentId = params.id as string
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAccessAndLoadDepartment = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

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
        .select('id, name, organization_id')
        .eq('id', departmentId)
        .single()

      if (deptError || !dept) {
        console.error('Error loading department:', deptError)
        router.push('/departments')
        return
      }

      setDepartment(dept)
    }

    if (departmentId) {
      checkAccessAndLoadDepartment()
    }
  }, [router, supabase, departmentId])

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!department) {
        throw new Error('Department not found')
      }

      // Create the agent
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .insert({
          organization_id: department.organization_id,
          name: agentName,
          description,
          model_provider: modelProvider,
          model_name: modelName,
          config: {
            prompt,
            is_active: false
          }
        })
        .select()
        .single()

      if (agentError) throw agentError

      // Associate agent with department
      const { error: assocError } = await supabase
        .from('agent_department_associations')
        .insert({
          agent_id: agent.id,
          department_id: departmentId
        })

      if (assocError) throw assocError

      router.push(`/departments/${departmentId}/agents`)
    } catch (err: any) {
      console.error('Error creating agent:', err)
      setError(err.message || 'Failed to create agent')
    } finally {
      setLoading(false)
    }
  }

  const handleModelProviderChange = (provider: string) => {
    setModelProvider(provider)
    // Set default model name based on provider
    switch (provider) {
      case 'gemini':
        setModelName('gemini-pro')
        break
      case 'deepseek':
        setModelName('deepseek-chat')
        break
      case 'openai':
        setModelName('gpt-4')
        break
      default:
        setModelName('')
    }
  }

  if (!hasAccess || !department) {
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
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href={`/departments/${departmentId}/agents`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Agents
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Create New AI Agent</h1>
            </div>
          </div>
          <p className="text-gray-600">Creating agent for department: <span className="font-medium">{department.name}</span></p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Agent Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure your AI agent for the {department.name} department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAgent} className="space-y-6">
                <div>
                  <label htmlFor="agentName" className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Name *
                  </label>
                  <input
                    id="agentName"
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Customer Support Bot"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Describe what this agent will do..."
                  />
                </div>

                <div>
                  <label htmlFor="modelProvider" className="block text-sm font-medium text-gray-700 mb-2">
                    AI Model Provider *
                  </label>
                  <select
                    id="modelProvider"
                    value={modelProvider}
                    onChange={(e) => handleModelProviderChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="modelName" className="block text-sm font-medium text-gray-700 mb-2">
                    Model Name *
                  </label>
                  <input
                    id="modelName"
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., gemini-pro, gpt-4, deepseek-chat"
                  />
                </div>

                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Instructions *
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={8}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Provide detailed instructions for your AI agent. For example:

You are a customer support agent for a SaaS company. Your role is to:
1. Respond to customer inquiries professionally and helpfully
2. Escalate complex technical issues to the engineering team
3. Provide accurate information about our products and services
4. Maintain a friendly and solution-oriented tone

Always ask clarifying questions when needed and provide step-by-step solutions."
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
                )}

                <div className="flex justify-end space-x-4">
                  <Link href={`/departments/${departmentId}/agents`}>
                    <Button variant="outline" type="button">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating Agent...' : 'Create Agent'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preview Card */}
          {agentName && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Agent Preview</CardTitle>
                <CardDescription>
                  This is how your agent will appear in the department dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div>
                    <h3 className="font-medium">{agentName}</h3>
                    <p className="text-sm text-gray-600">
                      {description || 'No description provided'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Model: {modelProvider} - {modelName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Department: {department.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-500">Inactive</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
