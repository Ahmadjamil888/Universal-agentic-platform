import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Shield, Zap, Users, BarChart3, Settings } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gray-900">UAP</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Build AI Agents That
            <span className="text-primary block">Do Real Work</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            UAP is the enterprise platform where companies build, run, and control AI agents 
            that automate real business tasks — safely, at scale, and under full governance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8 py-4">
                Start Building Agents
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            The AWS + ServiceNow + OpenAI for Enterprise Agents
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Instead of humans doing repetitive tasks, deploy AI agents that handle emails, 
            update CRMs, review contracts, and manage support tickets automatically.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Bot className="h-12 w-12 text-primary mb-4" />
              <CardTitle>AI Agent Builder</CardTitle>
              <CardDescription>
                Create custom AI agents with no-code workflows. Deploy agents that understand 
                your business context and execute complex tasks autonomously.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Built-in compliance, audit trails, and governance controls. 
                Every agent action is logged, explainable, and secure.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Zap className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Scale Automatically</CardTitle>
              <CardDescription>
                From single tasks to enterprise-wide automation. 
                Scale your AI workforce as your business grows.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription>
                Share agents across teams, set permissions, and collaborate 
                on automation workflows with your entire organization.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>
                Monitor agent performance, track ROI, and optimize workflows 
                with detailed analytics and reporting.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Settings className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Integration Hub</CardTitle>
              <CardDescription>
                Connect to your existing tools and systems. 
                Seamless integration with CRMs, email, databases, and APIs.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real Business Use Cases
            </h2>
            <p className="text-xl text-gray-600">
              See how companies are using UAP to automate critical business processes
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Customer Support Automation</CardTitle>
                <CardDescription>
                  AI agents that handle support tickets, escalate complex issues, 
                  and maintain customer satisfaction while reducing response times by 80%.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract Review & Processing</CardTitle>
                <CardDescription>
                  Automated contract analysis, risk assessment, and approval workflows 
                  that reduce legal review time from days to hours.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Pipeline Management</CardTitle>
                <CardDescription>
                  Agents that qualify leads, update CRM records, schedule meetings, 
                  and nurture prospects through personalized email sequences.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Operations</CardTitle>
                <CardDescription>
                  Automated invoice processing, expense categorization, and financial 
                  reporting that ensures accuracy and compliance.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Deploy Your AI Workforce?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of companies already using UAP to automate their business processes. 
            Start building your first AI agent today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8 py-4">
                Start Free Trial
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6" />
              <span className="text-xl font-bold">UAP</span>
            </div>
            <p className="text-gray-400">
              © 2024 Universal Agent Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
