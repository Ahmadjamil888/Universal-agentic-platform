'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, Zap, Activity, Clock } from 'lucide-react'
import Link from 'next/link'

export default function AnalyticsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }
    getUser()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-600">Monitor your AI agents and workflows</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8,547</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground">+2.1% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2s</div>
              <p className="text-xs text-muted-foreground">-0.3s from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Saved</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,450</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Agent Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>
                Execution count by agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Customer Support Bot</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium">3,247</div>
                    <div className="text-sm text-green-600">+15%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Email Processor</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium">2,891</div>
                    <div className="text-sm text-green-600">+8%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Data Analyzer</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium">1,456</div>
                    <div className="text-sm text-red-600">-3%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Lead Qualifier</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium">953</div>
                    <div className="text-sm text-green-600">+22%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Activity</CardTitle>
              <CardDescription>
                Most active workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Lead Qualification</h4>
                    <p className="text-sm text-gray-600">Automated lead scoring</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">1,234 runs</div>
                    <div className="text-xs text-green-600">98% success</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Response</h4>
                    <p className="text-sm text-gray-600">Auto-reply to inquiries</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">892 runs</div>
                    <div className="text-xs text-green-600">95% success</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Data Sync</h4>
                    <p className="text-sm text-gray-600">Database synchronization</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">456 runs</div>
                    <div className="text-xs text-yellow-600">87% success</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Report Generation</h4>
                    <p className="text-sm text-gray-600">Monthly reports</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">234 runs</div>
                    <div className="text-xs text-green-600">99% success</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cost Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
              <CardDescription>
                AI model usage costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Gemini API</span>
                  <span className="text-sm font-medium">$234.50</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">DeepSeek API</span>
                  <span className="text-sm font-medium">$156.30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Infrastructure</span>
                  <span className="text-sm font-medium">$89.20</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-medium">$480.00</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Savings */}
          <Card>
            <CardHeader>
              <CardTitle>Time Savings</CardTitle>
              <CardDescription>
                Hours saved by automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Customer Support</span>
                  <span className="text-sm font-medium">124h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Data Processing</span>
                  <span className="text-sm font-medium">89h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Report Generation</span>
                  <span className="text-sm font-medium">67h</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Saved</span>
                    <span className="font-medium">280h</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Error Analysis</CardTitle>
              <CardDescription>
                Common failure reasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">API Rate Limits</span>
                  <span className="text-sm font-medium">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Invalid Input</span>
                  <span className="text-sm font-medium">15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Timeout</span>
                  <span className="text-sm font-medium">8</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Errors</span>
                    <span className="font-medium">46</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
