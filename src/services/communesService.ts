import { supabase } from './supabase'

/** Retourne le nombre de réponses par commune (keyed par displayName → code via NOM_TO_CODE) */
export async function fetchParticipationByCommune(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('demographics')

  if (error) {
    console.error('[communesService] fetchParticipationByCommune error:', error)
    throw error
  }

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const commune = (row.demographics as { commune?: string })?.commune
    if (commune) counts[commune] = (counts[commune] ?? 0) + 1
  }
  return counts
}

/**
 * Retourne le nombre de sondages actifs par code INSEE.
 * Jointure surveys → communes pour obtenir code_insee directement.
 */
export async function fetchActiveSurveysCountByCommune(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('surveys')
    .select('commune:communes(code_insee)')
    .eq('is_active', true)
    .not('commune_id', 'is', null)

  if (error) {
    console.error('[communesService] fetchActiveSurveysCountByCommune error:', error)
    throw error
  }

  console.log('[communesService] active communal surveys raw:', data)

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const code = (row.commune as { code_insee?: string } | null)?.code_insee
    if (code) counts[code] = (counts[code] ?? 0) + 1
  }

  console.log('[communesService] active surveys by code INSEE:', counts)
  return counts
}
