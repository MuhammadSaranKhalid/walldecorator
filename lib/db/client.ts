import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import * as relations from './relations'

// Only cache the Pool — it holds the actual DB connections.
// Re-creating the drizzle() wrapper per module load is cheap and preserves schema types.
const globalForPg = globalThis as unknown as { pool: Pool | undefined }

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Cap concurrent connections. Supabase free tier / PgBouncer multiplexes these.
    max: 10,
  })
}

const pool = globalForPg.pool ?? createPool()
if (!globalForPg.pool) globalForPg.pool = pool

export const db = drizzle({
  client: pool,
  schema: { ...schema, ...relations },
})
