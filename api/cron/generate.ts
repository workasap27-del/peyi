import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SLOTS = ['fond_permanent', 'actualite', 'thematique', 'tension_sociale', 'prospective', 'culture', 'bilan']

function todaySlot(): string {
  const day = new Date().getDay() // 0=Sun
  const idx = day === 0 ? 6 : day - 1 // Mon=0 → idx=0
  return SLOTS[idx]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const slot = todaySlot()

  // Récupérer titres non utilisés du jour
  const today = new Date().toISOString().slice(0, 10)
  const { data: headlines } = await supabase
    .from('media_watch')
    .select('id, title')
    .eq('used', false)
    .gte('scraped_at', `${today}T00:00:00Z`)

  const titresScrapes = (headlines ?? []).map(h => h.title).join('\n')

  const systemPrompt = `Tu génères des questions citoyennes pour Péyi, plateforme de sondage hyperlocal en Guadeloupe.
RÈGLES ABSOLUES :
1. Une question = une décision à prendre, pas une opinion générale
2. La question doit créer de la tension (réponses non évidentes, population divisée possible)
3. La question doit être segmentable (résultats différents selon commune, âge, catégorie sociale)
4. Jamais deux fois le même angle sur 7 jours
5. Ancrer dans la réalité guadeloupéenne concrète (pas générique)
6. Longueur max : 25 mots
7. Ton : direct, pas condescendant, pas institutionnel
SLOT DU JOUR : ${slot}
ACTUALITÉS DU JOUR : ${titresScrapes || 'Aucune actualité disponible'}
Génère exactement 3 propositions. Réponds UNIQUEMENT en JSON :
{"proposals": [{"question": string, "why": string, "expected_split": string}]}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Génère les 3 propositions.' }],
    system: systemPrompt,
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  let proposals: { question: string; why: string; expected_split: string }[] = []

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      proposals = parsed.proposals ?? []
    }
  } catch {
    return res.status(500).json({ error: 'Failed to parse AI response', raw: text })
  }

  // Insérer dans question_proposals
  const inserted = []
  for (const p of proposals) {
    const { data, error } = await supabase.from('question_proposals').insert({
      slot_type: slot,
      question_text: p.question,
      context: titresScrapes,
      why: p.why,
      expected_split: p.expected_split,
    }).select('id').single()
    if (!error && data) inserted.push(data.id)
  }

  // Marquer les titres comme utilisés
  if (headlines?.length) {
    await supabase.from('media_watch')
      .update({ used: true })
      .in('id', headlines.map(h => h.id))
  }

  return res.status(200).json({ slot, inserted: inserted.length, proposals })
}
