import { createServerClient } from '@/lib/supabase'
import { generateWithGemini, generateWithDeepSeek } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workflowId, inputData } = await request.json()

    // Get workflow details
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check if user has access to this workflow
    const { data: organization } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!organization || organization.organization_id !== workflow.organization_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create execution record
    const { data: execution, error: executionError } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflowId,
        status: 'running',
        input_data: inputData,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (executionError) {
      return NextResponse.json({ error: 'Failed to create execution' }, { status: 500 })
    }

    // Execute workflow steps
    let result = inputData
    const steps = workflow.steps || []

    try {
      for (const step of steps) {
        switch (step.type) {
          case 'ai_generation':
            const modelProvider = step.config.modelProvider || 'gemini'
            const prompt = step.config.prompt || ''
            
            if (modelProvider === 'gemini') {
              result = await generateWithGemini(prompt, result)
            } else if (modelProvider === 'deepseek') {
              result = await generateWithDeepSeek(prompt, result)
            }
            break

          case 'email_action':
            // Handle email actions
            if (step.config.action === 'send') {
              // Send email logic here
              console.log('Sending email:', step.config)
            }
            break

          case 'data_processing':
            // Handle data processing
            if (step.config.action === 'transform') {
              result = transformData(result, step.config.transformation)
            }
            break

          default:
            console.log('Unknown step type:', step.type)
        }
      }

      // Update execution as completed
      await supabase
        .from('workflow_executions')
        .update({
          status: 'completed',
          output_data: result,
          completed_at: new Date().toISOString(),
        })
        .eq('id', execution.id)

      return NextResponse.json({
        success: true,
        executionId: execution.id,
        result: result,
      })

    } catch (error) {
      // Update execution as failed
      await supabase
        .from('workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', execution.id)

      return NextResponse.json({ 
        error: 'Workflow execution failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error executing workflow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: organization } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get workflows for the organization
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('organization_id', organization.organization_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
    }

    return NextResponse.json({ workflows })

  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function for data transformation
function transformData(data: any, transformation: any): any {
  // Implement data transformation logic
  switch (transformation.type) {
    case 'filter':
      return data.filter((item: any) => item[transformation.field] === transformation.value)
    case 'map':
      return data.map((item: any) => ({
        ...item,
        [transformation.field]: transformation.value
      }))
    case 'aggregate':
      return data.reduce((acc: any, item: any) => acc + item[transformation.field], 0)
    default:
      return data
  }
}
