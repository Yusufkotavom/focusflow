import fs from 'node:fs/promises'
import process from 'node:process'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL
  || process.env.DATABASE_URL_DIRECT
const migrationPath = process.argv[2]

if (!connectionString) {
  throw new Error('DATABASE_URL_DIRECT or DATABASE_URL is required')
}

if (!migrationPath) {
  throw new Error('Usage: node scripts/apply-sql.mjs <sql-file>')
}

const sqlText = await fs.readFile(migrationPath, 'utf8')
const db = postgres(connectionString, { prepare: false, max: 1 })

try {
  await db.unsafe(sqlText)
  console.log(`Applied SQL from ${migrationPath}`)
} finally {
  await db.end()
}
