import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.query.token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('question_proposals')
    .select('*')
    .gte('generated_at', `${today}T00:00:00Z`)
    .order('generated_at', { ascending: false })

  if (error) return res.status(500).json({ error })
  return res.status(200).json(data)
}
