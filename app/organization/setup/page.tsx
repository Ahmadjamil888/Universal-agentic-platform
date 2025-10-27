'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Minus, Building2, Users } from 'lucide-react'

interface Department {
  name: string
  description: string
  employeeCount: number
}

export default function OrganizationSetupPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [organizationName, setOrganizationName] = useState('')
  const [organizationDescription, setOrganizationDescription] = useState('')
  const [departments, setDepartments] = useState<Department[]>([
    { name: '', description: '', employeeCount: 5 }
  ])

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if user already has an organization
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (member) {
        router.push('/dashboard')
        return
      }

      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [router, supabase])

  const addDepartment = () => {
    setDepartments([...departments, { name: '', description: '', employeeCount: 5 }])
  }

  const removeDepartment = (index: number) => {
    if (departments.length > 1) {
      setDepartments(departments.filter((_, i) => i !== index))
    }
  }

  const updateDepartment = (index: number, field: keyof Department, value: string | number) => {
    const updated = [...departments]
    updated[index] = { ...updated[index], [field]: value }
    setDepartments(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)

    try {
      // Ensure user has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email
          })

        if (profileError) throw profileError
      }

      // Generate unique slug
      let baseSlug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      let slug = baseSlug
      let counter = 1

      while (true) {
        const { data: existing } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', slug)
          .single()

        if (!existing) break
        slug = `${baseSlug}-${counter}`
        counter++
      }

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          slug: slug
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Add user as organization owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner'
        })

      if (memberError) throw memberError

      // Create departments
      for (const dept of departments) {
        if (dept.name.trim()) {
          const { data: department, error: deptError } = await supabase
            .from('departments')
            .insert({
              organization_id: org.id,
              name: dept.name,
              description: dept.description,
              head_user_id: user.id // Initially set to owner, can be changed later
            })
            .select()
            .single()

          if (deptError) throw deptError

          // Add department head to department_members
          await supabase
            .from('department_members')
            .insert({
              department_id: department.id,
              user_id: user.id,
              role: 'head'
            })
        }
      }

      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error creating organization:', error)
      alert(`Failed to create organization: ${error.message || 'Unknown error'}. Please try again.`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set Up Your Organization</CardTitle>
          <CardDescription>
            Welcome! Let's create your organization and set up departments to get started with AI management.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Organization Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Organization Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orgName">Organization Name *</Label>
                  <Input
                    id="orgName"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Enter your organization name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="orgDescription">Description</Label>
                  <Textarea
                    id="orgDescription"
                    value={organizationDescription}
                    onChange={(e) => setOrganizationDescription(e.target.value)}
                    placeholder="Brief description of your organization"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Departments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Departments</h3>
                <Button type="button" variant="outline" onClick={addDepartment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </div>

              <div className="space-y-4">
                {departments.map((dept, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Department Name *</Label>
                        <Input
                          value={dept.name}
                          onChange={(e) => updateDepartment(index, 'name', e.target.value)}
                          placeholder="e.g., Marketing, Sales, HR"
                          required
                        />
                      </div>
                      <div>
                        <Label>Employee Count</Label>
                        <Input
                          type="number"
                          value={dept.employeeCount}
                          onChange={(e) => updateDepartment(index, 'employeeCount', parseInt(e.target.value) || 1)}
                          min="1"
                          placeholder="5"
                        />
                      </div>
                      <div className="flex items-end">
                        {departments.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeDepartment(index)}
                            className="w-full"
                          >
                            <Minus className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Description</Label>
                      <Textarea
                        value={dept.description}
                        onChange={(e) => updateDepartment(index, 'description', e.target.value)}
                        placeholder="Describe this department's responsibilities"
                        rows={2}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Organization:</span>
                  <p className="font-medium">{organizationName || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Departments:</span>
                  <p className="font-medium">{departments.filter(d => d.name.trim()).length}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Employees:</span>
                  <p className="font-medium">
                    {departments.reduce((sum, d) => sum + (d.employeeCount || 0), 0)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Your Role:</span>
                  <p className="font-medium">Owner</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting || !organizationName.trim()}>
                {submitting ? 'Creating Organization...' : 'Create Organization'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
