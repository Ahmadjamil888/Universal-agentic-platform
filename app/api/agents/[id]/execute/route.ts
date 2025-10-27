import { createServerClient } from '@/lib/supabase'
import { generateWithGemini, generateWithDeepSeek } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agentId = params.id
    const { input, context } = await request.json()

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Check if user has access to this agent
    const { data: organization } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!organization || organization.organization_id !== agent.organization_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Execute agent with AI model
    let result
    try {
      const prompt = agent.config.prompt || input
      
      if (agent.model_provider === 'gemini') {
        result = await generateWithGemini(prompt, context)
      } else if (agent.model_provider === 'deepseek') {
        result = await generateWithDeepSeek(prompt, context)
      } else {
        return NextResponse.json({ error: 'Unsupported model provider' }, { status: 400 })
      }

      // Log execution (you might want to create a separate table for this)
      console.log(`Agent ${agent.name} executed successfully`)

      return NextResponse.json({
        success: true,
        result: result,
        agent: {
          id: agent.id,
          name: agent.name,
          model: agent.model_provider,
        }
      })

    } catch (aiError) {
      console.error('AI execution error:', aiError)
      return NextResponse.json({ 
        error: 'AI execution failed',
        details: aiError instanceof Error ? aiError.message : 'Unknown AI error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error executing agent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
