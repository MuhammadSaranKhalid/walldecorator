import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import * as relations from './relations'

const globalForPg = globalThis as unknown as { pool: Pool | undefined }

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
  })
}

const pool = globalForPg.pool ?? createPool()
if (!globalForPg.pool) globalForPg.pool = pool

// Drizzle RQB (db.query.*) requires both table definitions AND relation
// definitions in the schema object. Per Drizzle docs the schema option
// accepts any object containing tables and/or relations — non-table keys
// are simply ignored by the query builder internals.
export const db = drizzle({ client: pool, schema: { ...schema, ...relations } })
