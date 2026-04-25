import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' })
  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const LIMIT = 2000
  const { data, error } = await supabase
    .from('survey_responses')
    .select('demographics, respondent_id, survey_id')
    .limit(LIMIT)
  if (error) return res.status(500).json({ error: error.message })
  if (data && data.length >= LIMIT) res.setHeader('X-Total-Limited', 'true')
  return res.status(200).json(data)
}
