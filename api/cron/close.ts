import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function calcReliability(n: number): string {
  if (n >= 500) return 'A'
  if (n >= 200) return 'B'
  if (n >= 50)  return 'C'
  return 'D'
}

function calcMargin(n: number): number {
  if (n === 0) return 0
  return Math.round((1 / Math.sqrt(n)) * 100 * 10) / 10
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Sondages expirés encore actifs
  const { data: surveys } = await supabase
    .from('surveys')
    .select('id, title, questions')
    .eq('is_active', true)
    .lt('ends_at', new Date().toISOString())

  if (!surveys?.length) return res.status(200).json({ closed: 0 })

  const closed = []

  for (const survey of surveys) {
    // Récupérer les réponses
    const { data: responses } = await supabase
      .from('survey_responses')
      .select('answers, demographics')
      .eq('survey_id', survey.id)

    const n = responses?.length ?? 0
    const margin = calcMargin(n)
    const reliability = calcReliability(n)

    // Ventilation démographique
    const demo: Record<string, Record<string, number>> = { age: {}, genre: {}, commune: {} }
    for (const r of responses ?? []) {
      const d = r.demographics as Record<string, string> | null
      if (d?.age_group) demo.age[d.age_group] = (demo.age[d.age_group] ?? 0) + 1
      if (d?.gender) demo.genre[d.gender] = (demo.genre[d.gender] ?? 0) + 1
      if (d?.commune) demo.commune[d.commune] = (demo.commune[d.commune] ?? 0) + 1
    }

    // Détection biais
    const biasFlags: string[] = []
    if (n < 50) biasFlags.push('Résultats indicatifs uniquement (n<50)')
    for (const [commune, count] of Object.entries(demo.commune)) {
      if (n > 0 && (count / n) > 0.4) biasFlags.push(`Biais géographique : ${commune} surreprésentée (${Math.round(count/n*100)}%)`)
    }
    for (const [age, count] of Object.entries(demo.age)) {
      if (n > 0 && (count / n) > 0.5) biasFlags.push(`Biais démographique : ${age} surreprésentée (${Math.round(count/n*100)}%)`)
    }

    // Génération interprétation via Claude
    let interpretation = ''
    if (n >= 10) {
      try {
        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          messages: [{
            role: 'user',
            content: `Rédige une interprétation en 3 paragraphes pour ce sondage Péyi (Guadeloupe) :
Titre : "${survey.title}"
N répondants : ${n}
Marge d'erreur : ±${margin}%
Score fiabilité : ${reliability}
Ventilation âge : ${JSON.stringify(demo.age)}
Ventilation commune : ${JSON.stringify(demo.commune)}
Biais détectés : ${biasFlags.join(', ') || 'Aucun'}

Paragraphe 1 : constat factuel. Paragraphe 2 : nuances selon les segments. Paragraphe 3 : perspective et recommandations.`,
          }],
        })
        interpretation = msg.content[0].type === 'text' ? msg.content[0].text : ''
      } catch { /* silencieux */ }
    }

    // Insérer dans survey_results (si table existe)
    try {
      await supabase.from('survey_results').insert({
        question_id: null,
        n_total: n,
        margin_error: margin,
        reliability_score: reliability,
        bias_flags: biasFlags,
        demographic_breakdown: demo,
        commune_breakdown: demo.commune,
        interpretation,
      })
    } catch { /* table pas encore créée */ }

    // Clore le sondage
    await supabase.from('surveys').update({ is_active: false }).eq('id', survey.id)
    closed.push({ id: survey.id, n, reliability })
  }

  return res.status(200).json({ closed: closed.length, surveys: closed })
}
