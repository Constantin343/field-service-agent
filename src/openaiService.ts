import OpenAI from 'openai'
import { OPENAI_MODEL } from './config.js'

const openai = new OpenAI()

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function getAssistantResponse(messages: Message[]): Promise<string> {
  const chatCompletion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages,
    temperature: 0,
  })
  return chatCompletion.choices[0].message.content ?? ''
}
