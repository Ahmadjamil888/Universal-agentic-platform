import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createClient = () => createClientComponentClient()

export const createServerClient = () => createServerComponentClient({ cookies })

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          department_id: string | null
          role: 'owner' | 'admin' | 'department_head' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          department_id?: string | null
          role?: 'owner' | 'admin' | 'department_head' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          department_id?: string | null
          role?: 'owner' | 'admin' | 'department_head' | 'member'
          created_at?: string
          updated_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          head_user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          head_user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          head_user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      department_members: {
        Row: {
          id: string
          department_id: string
          user_id: string
          role: 'head' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          department_id: string
          user_id: string
          role?: 'head' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          department_id?: string
          user_id?: string
          role?: 'head' | 'member'
          created_at?: string
          updated_at?: string
        }
      }
      agent_department_associations: {
        Row: {
          id: string
          agent_id: string
          department_id: string
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          department_id: string
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          department_id?: string
          created_at?: string
        }
      }
      ai_usage_logs: {
        Row: {
          id: string
          agent_id: string
          user_id: string
          department_id: string
          action: string
          input_tokens: number | null
          output_tokens: number | null
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          user_id: string
          department_id: string
          action: string
          input_tokens?: number | null
          output_tokens?: number | null
          duration_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          user_id?: string
          department_id?: string
          action?: string
          input_tokens?: number | null
          output_tokens?: number | null
          duration_ms?: number | null
          created_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          model_provider: string
          model_name: string
          config: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          model_provider: string
          model_name: string
          config?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          model_provider?: string
          model_name?: string
          config?: any
          created_at?: string
          updated_at?: string
        }
      }
      workflows: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          steps: any
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          steps?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          steps?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workflow_executions: {
        Row: {
          id: string
          workflow_id: string
          status: string
          input_data: any
          output_data: any
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          status: string
          input_data?: any
          output_data?: any
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          status?: string
          input_data?: any
          output_data?: any
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          organization_id: string
          name: string
          key_prefix: string
          key_hash: string
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          key_prefix: string
          key_hash: string
          last_used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          key_prefix?: string
          key_hash?: string
          last_used_at?: string | null
          created_at?: string
        }
      }
    }
  }
}
