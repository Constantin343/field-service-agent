import dotenv from 'dotenv'

dotenv.config()

export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000
export const ML_API_KEY = process.env.ML_API_KEY

if (!ML_API_KEY) {
  console.error('Missing ML_API_KEY. Please check your .env file.')
  process.exit(1)
}
