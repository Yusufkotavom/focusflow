import process from 'node:process'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL
  || process.env.DATABASE_URL_DIRECT
const query = process.argv[2]

if (!connectionString) {
  throw new Error('DATABASE_URL_DIRECT or DATABASE_URL is required')
}

if (!query) {
  throw new Error('Usage: node scripts/query-sql.mjs <sql-query>')
}

const db = postgres(connectionString, { prepare: false, max: 1 })

try {
  const rows = await db.unsafe(query)
  console.log(JSON.stringify(rows, null, 2))
} finally {
  await db.end()
}
