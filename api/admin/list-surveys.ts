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

  const SURVEY_FIELDS = 'id, title, description, questions, is_active, created_at, ends_at, recurrence_type, commune_id, communes(name)'

  try {
    const [{ data: active }, { data: closed }] = await Promise.all([
      sb.from('surveys')
        .select(SURVEY_FIELDS)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      sb.from('surveys')
        .select(SURVEY_FIELDS)
        .eq('is_active', false)
        .order('ends_at', { ascending: false })
        .limit(20),
    ])

    // Comptages réponses pour actifs + clôturés
    const withCounts = async (surveys: any[]) =>
      Promise.all(
        (surveys ?? []).map(async (s) => {
          const { count } = await sb
            .from('survey_responses')
            .select('*', { count: 'exact', head: true })
            .eq('survey_id', s.id)
          const closed_at = s.ends_at ?? s.created_at
          return { ...s, _count: count ?? 0, closed_at }
        })
      )

    const [activeWithCounts, closedWithCounts] = await Promise.all([
      withCounts(active ?? []),
      withCounts(closed ?? []),
    ])

    return res.status(200).json({ active: activeWithCounts, closed: closedWithCounts })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
