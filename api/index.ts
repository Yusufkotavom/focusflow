import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { db } from './db'
import { users } from '../src/db/schema'

export const config = {
  runtime: 'edge',
}

const app = new Hono().basePath('/api')

app.get('/hello', (c) => {
  return c.json({
    message: 'Hello from Hono!',
  })
})

app.get('/users', async (c) => {
  try {
    const allUsers = await db.select().from(users)
    return c.json(allUsers)
  } catch (error) {
    return c.json({ message: 'Internal Server Error', error: String(error) }, 500)
  }
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const PATCH = handle(app)
