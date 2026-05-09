import { defineConfig } from 'prisma/config'
import { configDotenv } from 'dotenv'

// Prisma CLI doesn't auto-load .env.local, so we do it explicitly
configDotenv({ path: '.env.local', override: false })
configDotenv({ path: '.env', override: false })

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
