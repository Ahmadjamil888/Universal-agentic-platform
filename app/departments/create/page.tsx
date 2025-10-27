'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateDepartmentPage() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    headUserId: '',
    employeeCount: 5
  })

  const [availableUsers, setAvailableUsers] = useState<any[]>([])

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const initializePage = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check user's role and permissions
      const { data: member } = await supabase
        .from('organization_members')
        .select('role, organization_id')
        .eq('user_id', user.id)
        .single()

      if (!member) {
        router.push('/organization/setup')
        return
      }

      // Only owners and admins can create departments
      if (!['owner', 'admin'].includes(member.role)) {
        router.push('/dashboard')
        return
      }

      setUser(user)
      setUserRole(member.role)

      // Get available users for department head selection
      const { data: users } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          profiles:user_id (
            id,
            full_name,
            email
          )
        `)
        .eq('organization_id', member.organization_id)

      if (users) {
        setAvailableUsers(users.map((u: any) => ({
          id: u.user_id,
          name: u.profiles?.full_name || u.profiles?.email || '',
          email: u.profiles?.email || ''
        })))
      }

      // Set default head to current user
      setFormData(prev => ({ ...prev, headUserId: user.id }))

      setLoading(false)
    }

    initializePage()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.name.trim()) return

    setSubmitting(true)

    try {
      // Get user's organization
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!member) throw new Error('Organization not found')

      // Create department
      const { data: department, error: deptError } = await supabase
        .from('departments')
        .insert({
          organization_id: member.organization_id,
          name: formData.name,
          description: formData.description,
          head_user_id: formData.headUserId
        })
        .select()
        .single()

      if (deptError) throw deptError

      // Add department head to department_members
      await supabase
        .from('department_members')
        .insert({
          department_id: department.id,
          user_id: formData.headUserId,
          role: 'head'
        })

      router.push('/departments')
    } catch (error) {
      console.error('Error creating department:', error)
      alert('Failed to create department. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/departments">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Departments
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Department</h1>
          <p className="text-gray-600 mt-1">Set up a new department for your organization</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Department Information</span>
            </CardTitle>
            <CardDescription>
              Fill in the details for your new department
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Department Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Marketing, Sales, Engineering"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="employeeCount">Expected Employee Count</Label>
                  <Input
                    id="employeeCount"
                    type="number"
                    value={formData.employeeCount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('employeeCount', parseInt(e.target.value) || 1)}
                    min="1"
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the department's responsibilities and goals"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="headUser">Department Head *</Label>
                <Select
                  value={formData.headUserId}
                  onValueChange={(value) => handleInputChange('headUserId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department head" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  The department head will have management privileges for this department
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Department:</span>
                    <p className="font-medium">{formData.name || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Expected Employees:</span>
                    <p className="font-medium">{formData.employeeCount}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Department Head:</span>
                    <p className="font-medium">
                      {availableUsers.find(u => u.id === formData.headUserId)?.name || 'Not selected'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/departments">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={submitting || !formData.name.trim()}>
                  {submitting ? 'Creating Department...' : 'Create Department'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
