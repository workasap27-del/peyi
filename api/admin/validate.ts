import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (req.query.token !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' })

  const { proposal_id } = req.body as { proposal_id: string }
  if (!proposal_id) return res.status(400).json({ error: 'proposal_id required' })

  // Récupérer la proposition pour avoir la date
  const { data: proposal } = await supabase
    .from('question_proposals')
    .select('generated_at')
    .eq('id', proposal_id)
    .single()

  if (!proposal) return res.status(404).json({ error: 'Proposal not found' })

  const day = proposal.generated_at.slice(0, 10)

  // Valider la proposition sélectionnée
  await supabase.from('question_proposals')
    .update({ status: 'validated', selected_at: new Date().toISOString() })
    .eq('id', proposal_id)

  // Rejeter les autres du même jour
  await supabase.from('question_proposals')
    .update({ status: 'rejected' })
    .neq('id', proposal_id)
    .gte('generated_at', `${day}T00:00:00Z`)
    .lt('generated_at', `${day}T23:59:59Z`)

  return res.status(200).json({ validated: proposal_id })
}
