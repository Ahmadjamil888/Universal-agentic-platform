'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, ArrowLeft, Plus, Trash2, Move } from 'lucide-react'
import Link from 'next/link'

interface WorkflowStep {
  id: string
  type: 'trigger' | 'action' | 'condition'
  title: string
  description: string
  config: any
}

export default function CreateWorkflowPage() {
  const [workflowName, setWorkflowName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: '1',
      type: 'trigger',
      title: 'Email Received',
      description: 'When a new email is received',
      config: {}
    }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  const addStep = (type: 'action' | 'condition') => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      type,
      title: type === 'action' ? 'New Action' : 'New Condition',
      description: type === 'action' ? 'Perform an action' : 'Check a condition',
      config: {}
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id))
  }

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Here you would typically save to your database
      await new Promise(resolve => setTimeout(resolve, 2000))
      router.push('/dashboard')
    } catch (err) {
      setError('Failed to create workflow')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Create New Workflow</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workflow Configuration */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Settings</CardTitle>
                <CardDescription>
                  Configure your workflow details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateWorkflow} className="space-y-4">
                  <div>
                    <label htmlFor="workflowName" className="block text-sm font-medium text-gray-700 mb-2">
                      Workflow Name
                    </label>
                    <input
                      id="workflowName"
                      type="text"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., Lead Qualification"
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
                      placeholder="Describe what this workflow does..."
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                  )}

                  <div className="flex flex-col space-y-2">
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? 'Creating Workflow...' : 'Create Workflow'}
                    </Button>
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full">Cancel</Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Add Step Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Add Steps</CardTitle>
                <CardDescription>
                  Build your workflow by adding steps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    onClick={() => addStep('action')} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Action
                  </Button>
                  <Button 
                    onClick={() => addStep('condition')} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Builder */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Builder</CardTitle>
                <CardDescription>
                  Design your workflow by connecting steps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div key={step.id} className="relative">
                      {/* Step Card */}
                      <div className={`p-4 border-2 rounded-lg ${
                        step.type === 'trigger' ? 'border-green-200 bg-green-50' :
                        step.type === 'action' ? 'border-blue-200 bg-blue-50' :
                        'border-yellow-200 bg-yellow-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${
                              step.type === 'trigger' ? 'bg-green-100' :
                              step.type === 'action' ? 'bg-blue-100' :
                              'bg-yellow-100'
                            }`}>
                              {step.type === 'trigger' ? <Zap className="h-4 w-4 text-green-600" /> :
                               step.type === 'action' ? <Move className="h-4 w-4 text-blue-600" /> :
                               <div className="h-4 w-4 rounded-full bg-yellow-600"></div>}
                            </div>
                            <div>
                              <h3 className="font-medium">{step.title}</h3>
                              <p className="text-sm text-gray-600">{step.description}</p>
                            </div>
                          </div>
                          {step.type !== 'trigger' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStep(step.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Connector Arrow */}
                      {index < steps.length - 1 && (
                        <div className="flex justify-center py-2">
                          <div className="w-0.5 h-6 bg-gray-300"></div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty State */}
                  {steps.length === 1 && (
                    <div className="text-center py-8 text-gray-500">
                      <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Add actions and conditions to build your workflow</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
