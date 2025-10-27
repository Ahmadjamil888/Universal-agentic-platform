import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '')
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

export async function generateWithGemini(prompt: string, context: any = {}) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    const fullPrompt = `${JSON.stringify(context, null, 2)}\n\n${prompt}`
    const result = await model.generateContent(fullPrompt)
    return result.response.text()
  } catch (error) {
    console.error('Error generating with Gemini:', error)
    throw error
  }
}

export async function generateWithDeepSeek(prompt: string, context: any = {}) {
  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that follows instructions precisely.',
        },
        {
          role: 'user',
          content: `${JSON.stringify(context, null, 2)}\n\n${prompt}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    return response.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('Error generating with DeepSeek:', error)
    throw error
  }
}
