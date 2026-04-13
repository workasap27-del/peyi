import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const today = new Date().toISOString().slice(0, 10)

  // Chercher une proposition validée aujourd'hui
  const { data: proposal } = await supabase
    .from('question_proposals')
    .select('*')
    .eq('status', 'validated')
    .gte('selected_at', `${today}T00:00:00Z`)
    .order('selected_at', { ascending: false })
    .limit(1)
    .single()

  if (!proposal) {
    console.log(`[publish] Aucune proposition validée pour ${today}`)
    return res.status(200).json({ published: false, reason: 'no_validated_proposal' })
  }

  const closesAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  const { data: survey, error } = await supabase.from('surveys').insert({
    title: proposal.question_text,
    description: `Slot : ${proposal.slot_type} — ${proposal.why}`,
    questions: [{
      id: 'q1',
      type: 'single',
      label: proposal.question_text,
      required: true,
      options: ['Oui tout à fait', 'Plutôt oui', 'Plutôt non', 'Non pas du tout'],
    }],
    is_active: true,
    ends_at: closesAt,
  }).select('id').single()

  if (error) return res.status(500).json({ error })

  return res.status(200).json({ published: true, survey_id: survey?.id, question: proposal.question_text })
}
