import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { createClient } from '@supabase/supabase-js'

declare const process: {
  env: Record<string, string | undefined>
}

export const config = {
  runtime: 'edge',
}

const app = new Hono().basePath('/api')

type PerspectivePayload = {
  id: string
  user_id: string
  name: string
  description?: string | null
  icon?: string | null
  rules: Record<string, unknown>
  group_by?: string | null
  sort_by?: string | null
  show_completed?: boolean | null
  show_dropped?: boolean | null
  order?: number | null
}

function decodeJwtSub(token: string | undefined) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4)
    const payload = JSON.parse(atob(padded)) as { sub?: string }
    return payload.sub ?? null
  } catch {
    return null
  }
}

function getServiceSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service configuration')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

app.get('/hello', (c) => {
  return c.json({
    message: 'Hello from Hono!',
  })
})

app.post('/perspectives', async (c) => {
  const authHeader = c.req.header('authorization')
  const userId = decodeJwtSub(authHeader?.replace(/^Bearer\s+/i, ''))
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const payload = (await c.req.json()) as { perspective?: PerspectivePayload }
  if (!payload.perspective) return c.json({ message: 'Missing perspective payload' }, 400)
  if (payload.perspective.user_id !== userId) return c.json({ message: 'Forbidden' }, 403)

  try {
    const supabase = getServiceSupabase()
    const { error } = await supabase.from('perspectives').insert([payload.perspective])
    if (error) return c.json({ message: error.message }, 400)
    return c.json({ ok: true })
  } catch (error) {
    return c.json({ message: 'Internal Server Error', error: String(error) }, 500)
  }
})

app.patch('/perspectives/:id', async (c) => {
  const authHeader = c.req.header('authorization')
  const userId = decodeJwtSub(authHeader?.replace(/^Bearer\s+/i, ''))
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const perspectiveId = c.req.param('id')
  const payload = (await c.req.json()) as { updates?: Record<string, unknown> }
  if (!payload.updates) return c.json({ message: 'Missing updates payload' }, 400)

  try {
    const supabase = getServiceSupabase()
    const { error } = await supabase
      .from('perspectives')
      .update(payload.updates)
      .eq('id', perspectiveId)
      .eq('user_id', userId)
    if (error) return c.json({ message: error.message }, 400)
    return c.json({ ok: true })
  } catch (error) {
    return c.json({ message: 'Internal Server Error', error: String(error) }, 500)
  }
})

app.delete('/perspectives/:id', async (c) => {
  const authHeader = c.req.header('authorization')
  const userId = decodeJwtSub(authHeader?.replace(/^Bearer\s+/i, ''))
  if (!userId) return c.json({ message: 'Unauthorized' }, 401)

  const perspectiveId = c.req.param('id')

  try {
    const supabase = getServiceSupabase()
    const { error } = await supabase
      .from('perspectives')
      .delete()
      .eq('id', perspectiveId)
      .eq('user_id', userId)
    if (error) return c.json({ message: error.message }, 400)
    return c.json({ ok: true })
  } catch (error) {
    return c.json({ message: 'Internal Server Error', error: String(error) }, 500)
  }
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const PATCH = handle(app)
