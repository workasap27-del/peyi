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

  const { survey_id } = req.body
  if (!survey_id) return res.status(400).json({ error: 'survey_id requis' })

  try {
    const { error } = await sb
      .from('surveys')
      .update({ is_active: false })
      .eq('id', survey_id)

    if (error) throw error

    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
