'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function CreateAgentPage() {
  const [agentName, setAgentName] = useState('')
  const [description, setDescription] = useState('')
  const [modelProvider, setModelProvider] = useState('gemini')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Here you would typically save to your database
      // For now, we'll just simulate the creation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      router.push('/dashboard')
    } catch (err) {
      setError('Failed to create agent')
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
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Create New AI Agent</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Agent Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure your AI agent to handle specific business tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAgent} className="space-y-6">
                <div>
                  <label htmlFor="agentName" className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Name
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
                    AI Model
                  </label>
                  <select
                    id="modelProvider"
                    value={modelProvider}
                    onChange={(e) => setModelProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="gemini">Google Gemini Pro</option>
                    <option value="deepseek">DeepSeek Chat</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Instructions
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
                  <div className="text-red-600 text-sm">{error}</div>
                )}

                <div className="flex justify-end space-x-4">
                  <Link href="/dashboard">
                    <Button variant="outline">Cancel</Button>
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
                  This is how your agent will appear in the dashboard
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
                      Model: {modelProvider === 'gemini' ? 'Google Gemini Pro' : 'DeepSeek Chat'}
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
    </div>
  )
}
