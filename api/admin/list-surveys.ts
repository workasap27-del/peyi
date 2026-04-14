import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const [{ data: active }, { data: closed }] = await Promise.all([
      sb.from('surveys')
        .select('id, title, created_at, ends_at, commune_id, communes(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      sb.from('surveys')
        .select('id, title, created_at, ends_at')
        .eq('is_active', false)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    // Charger les comptages de réponses pour chaque sondage actif
    const activeWithCounts = await Promise.all(
      (active ?? []).map(async (s) => {
        const { count } = await sb
          .from('survey_responses')
          .select('*', { count: 'exact', head: true })
          .eq('survey_id', s.id)
        return { ...s, _count: count ?? 0 }
      })
    )

    return res.status(200).json({ active: activeWithCounts, closed: closed ?? [] })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
