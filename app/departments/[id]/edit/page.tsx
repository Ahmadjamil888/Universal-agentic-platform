'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'

interface Department {
  id: string
  name: string
  description: string | null
  head_user_id: string
  organization_id: string
}

interface UserOption {
  id: string
  email: string
  full_name: string | null
}

export default function EditDepartmentPage() {
  const [department, setDepartment] = useState<Department | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [headUserId, setHeadUserId] = useState('')
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hasAccess, setHasAccess] = useState(false)

  const router = useRouter()
  const params = useParams()
  const departmentId = params.id as string
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadDepartmentAndUsers = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if user is admin/owner
      const { data: member } = await supabase
        .from('organization_members')
        .select('role, organization_id')
        .eq('user_id', user.id)
        .single()

      if (!member || !['owner', 'admin'].includes(member.role)) {
        alert('You do not have permission to edit departments')
        router.push('/departments')
        return
      }

      setHasAccess(true)

      // Load department details
      const { data: dept, error: deptError } = await supabase
        .from('departments')
        .select('id, name, description, head_user_id, organization_id')
        .eq('id', departmentId)
        .single()

      if (deptError || !dept) {
        console.error('Error loading department:', deptError)
        router.push('/departments')
        return
      }

      setDepartment(dept)
      setName(dept.name)
      setDescription(dept.description || '')
      setHeadUserId(dept.head_user_id)

      // Load available users (org members who can be department heads)
      const { data: users } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .eq('organization_id', member.organization_id)
        .in('role', ['admin', 'department_head', 'member'])

      const userOptions: UserOption[] = users?.map((m: any) => ({
        id: m.user_id,
        email: m.profiles?.email || '',
        full_name: m.profiles?.full_name
      })) || []

      setAvailableUsers(userOptions)
      setLoading(false)
    }

    if (departmentId) {
      loadDepartmentAndUsers()
    }
  }, [router, supabase, departmentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!department) {
        throw new Error('Department not found')
      }

      const { error: updateError } = await supabase
        .from('departments')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          head_user_id: headUserId
        })
        .eq('id', departmentId)

      if (updateError) throw updateError

      router.push(`/departments/${departmentId}`)
    } catch (err: any) {
      console.error('Error updating department:', err)
      setError(err.message || 'Failed to update department')
    } finally {
      setSaving(false)
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

  if (!hasAccess || !department) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-600 mt-2">You don't have permission to edit this department.</p>
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
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href={`/departments/${departmentId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Department
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Edit Department</h1>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Department Information</CardTitle>
              <CardDescription>
                Update the department details and assign a department head
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Engineering, Sales, Marketing"
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
                    placeholder="Describe the department's purpose and responsibilities..."
                  />
                </div>

                <div>
                  <label htmlFor="headUser" className="block text-sm font-medium text-gray-700 mb-2">
                    Department Head *
                  </label>
                  <select
                    id="headUser"
                    value={headUserId}
                    onChange={(e) => setHeadUserId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select a department head...</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    The department head will have additional permissions to manage this department
                  </p>
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
                )}

                <div className="flex justify-end space-x-4">
                  <Link href={`/departments/${departmentId}`}>
                    <Button variant="outline" type="button">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Current Department Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Department Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Current Name</p>
                  <p className="text-sm text-gray-600">{department.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Current Description</p>
                  <p className="text-sm text-gray-600">{department.description || 'No description'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Current Head</p>
                  <p className="text-sm text-gray-600">
                    {availableUsers.find(u => u.id === department.head_user_id)?.full_name ||
                     availableUsers.find(u => u.id === department.head_user_id)?.email ||
                     'Not assigned'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
