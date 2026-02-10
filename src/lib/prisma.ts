import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("CRITICAL ERROR: DATABASE_URL is missing from environment variables.")
}

let prisma: PrismaClient

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma
} else {
  const pool = new Pool({ 
    connectionString,
    max: 10, // Limit connections
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000 
  })

  // Handle pool errors to prevent process crash
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err)
  })

  const adapter = new PrismaPg(pool)

  prisma = new PrismaClient({
    adapter,
    log: ['warn', 'error'],
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }
}

export { prisma }