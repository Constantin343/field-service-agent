import { twiml } from 'twilio'
import twilio from 'twilio'
import { INITIAL_MESSAGE, SYSTEM_MESSAGE, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } from './config.js'
import { Message } from './openaiService.js'

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

export function createInitialResponse(): string {
  const voiceResponse = new twiml.VoiceResponse()
  voiceResponse.say(INITIAL_MESSAGE)
  return JSON.stringify([
    { role: "system", content: SYSTEM_MESSAGE },
    { role: "assistant", content: INITIAL_MESSAGE }
  ] as Message[])
}

export function createGatherResponse(): twiml.VoiceResponse {
  const voiceResponse = new twiml.VoiceResponse()
  voiceResponse.gather({
    input: ["speech"],
    speechTimeout: "auto",
    speechModel: 'experimental_conversations',
    enhanced: true,
    action: '/respond',
  })
  return voiceResponse
}

export function createAssistantResponse(assistantResponse: string): twiml.VoiceResponse {
  const voiceResponse = new twiml.VoiceResponse()
  voiceResponse.say(assistantResponse)
  voiceResponse.redirect({ method: "POST" }, "/incoming-call")
  return voiceResponse
}

export async function makeOutgoingCall(to: string, from: string): Promise<void> {
  try {
    await client.calls.create({
      twiml: '<Response><Say>This is a test call from your Twilio-powered application.</Say></Response>',
      to: to,
      from: from
    });
    console.log('Call initiated successfully');
  } catch (error) {
    console.error('Error making outgoing call:', error);
  }
}
