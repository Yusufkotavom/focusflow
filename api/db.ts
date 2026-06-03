import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '../src/db/schema.js'

declare const process: {
  env: Record<string, string | undefined>
}

// Hubungkan ke Supabase (menggunakan DATABASE_URL dari Supabase)
const client = postgres(process.env.DATABASE_URL!, { prepare: false })
export const db = drizzle(client, { schema })
