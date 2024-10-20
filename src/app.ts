import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { getCookie, setCookie } from 'hono/cookie'
import { PORT } from './config.js'
import { createInitialResponse, createGatherResponse, createAssistantResponse, makeOutgoingCall } from './twilioService.js'
import { getAssistantResponse, Message } from './openaiService.js'

const app = new Hono()

app.use('*', logger())

app.post('/incoming-call', (c) => {
  const voiceResponse = createGatherResponse()
  
  if (!getCookie(c, "messages")) {
    // This is a new conversation!
    setCookie(c, "messages", createInitialResponse())
  }

  c.header("Content-Type", "application/xml")
  return c.body(voiceResponse.toString())
})

app.post('/respond', async (c) => {
  const formData = await c.req.formData()
  const voiceInput = formData.get("SpeechResult")?.toString() ?? ""

  let messages: Message[] = JSON.parse(getCookie(c, "messages") ?? "[]")
  messages.push({ role: "user", content: voiceInput })

  const assistantResponse = await getAssistantResponse(messages)
  messages.push({ role: "assistant", content: assistantResponse })

  console.log(messages)
  setCookie(c, "messages", JSON.stringify(messages))

  const voiceResponse = createAssistantResponse(assistantResponse)

  c.header("Content-Type", "application/xml")
  return c.body(voiceResponse.toString())
})

app.post('/make-call', async (c) => {
  const { to, from } = await c.req.json()
  await makeOutgoingCall(to, from)
  return c.json({ message: 'Call initiated' })
})

console.log(`Server is running on port ${PORT}`)

serve({
  fetch: app.fetch,
  port: PORT
})
