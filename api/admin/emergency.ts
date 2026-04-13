import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (req.query.token !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' })

  const { question_text, slot_type } = req.body as { question_text: string; slot_type: string }
  if (!question_text) return res.status(400).json({ error: 'question_text required' })

  const closesAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase.from('surveys').insert({
    title: question_text,
    description: `Mode urgence — Slot : ${slot_type ?? 'manuel'}`,
    questions: [{
      id: 'q1',
      type: 'single',
      label: question_text,
      required: true,
      options: ['Oui tout à fait', 'Plutôt oui', 'Plutôt non', 'Non pas du tout'],
    }],
    is_active: true,
    ends_at: closesAt,
  }).select('*').single()

  if (error) return res.status(500).json({ error })
  return res.status(201).json(data)
}
