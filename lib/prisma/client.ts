import { PrismaClient } from '@/lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPool() {
  // Use DATABASE_URL (Supabase Transaction Pooler, port 6543) to route
  // through PgBouncer instead of the direct connection (DIRECT_URL).
  // This prevents "Max client connections reached" in serverless environments.
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Cap concurrent connections from this process to a safe limit.
    // Supabase free tier allows 60 direct connections; PgBouncer multiplexes.
    max: 10,
  })
}

function createPrismaClient() {
  const pool = globalForPrisma.pool ?? createPool()

  // Cache the pool so dev hot-reloads don't leak new Pool instances
  if (!globalForPrisma.pool) globalForPrisma.pool = pool

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
