import dotenv from 'dotenv'

dotenv.config()

export const PORT = process.env.PORT || 3000
export const AIEXPLAIN_API_KEY = process.env.AIEXPLAIN_API_KEY || ''
export const ML_API_KEY = process.env.ML_API_KEY || ''
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

if (!AIEXPLAIN_API_KEY) {
  console.error('Missing AIEXPLAIN_API_KEY. Please check your .env file.')
  process.exit(1)
}

if (!ML_API_KEY) {
    console.error('Missing AIEXPLAIN_API_KEY. Please check your .env file.')
    process.exit(1)
  }

if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY. Please check your .env file.')
  process.exit(1)
}
