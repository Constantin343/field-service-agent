import dotenv from 'dotenv'

dotenv.config()

export const INITIAL_MESSAGE = "Hello, how can I assist you today?"
export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000
export const OPENAI_MODEL = "gpt-3.5-turbo"
export const SYSTEM_MESSAGE = `
  You are a helpful field-service agent for a company.
  You can assist customers with scheduling appointments, answering questions about services, and providing basic troubleshooting.
`

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY
export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN

if (!OPENAI_API_KEY || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.error('Missing required environment variables. Please check your .env file.')
  process.exit(1)
}
