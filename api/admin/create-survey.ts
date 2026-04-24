import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { title, description, questions, is_active, ends_at } = req.body

  if (!title?.trim()) return res.status(400).json({ error: 'Titre requis' })

  try {
    const { data, error } = await sb.from('surveys').insert({
      title: title.trim(),
      description: description?.trim() || null,
      commune_id: null,
      questions,
      is_active: is_active ?? true,
      ends_at: ends_at ?? null,
    }).select('id').single()

    if (error) throw error

    return res.status(200).json({ id: data.id })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
