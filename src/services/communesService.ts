import { supabase } from './supabase'

/** Retourne le nombre de réponses par commune (keyed par displayName → code via NOM_TO_CODE) */
export async function fetchParticipationByCommune(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('demographics')

  if (error) {
    // RLS peut bloquer SELECT sur survey_responses pour les anonymes — on retourne {} sans throw
    console.warn('[communesService] fetchParticipationByCommune:', error.message)
    return {}
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
 * Deux requêtes séparées pour éviter la dépendance à la FK déclarée en schéma.
 */
export async function fetchActiveSurveysCountByCommune(): Promise<Record<string, number>> {
  // 1. Récupère tous les sondages actifs ayant un commune_id
  const { data: surveys, error: surveyError } = await supabase
    .from('surveys')
    .select('commune_id')
    .eq('is_active', true)
    .not('commune_id', 'is', null)

  if (surveyError) {
    console.error('[communesService] fetchActiveSurveysCountByCommune surveys error:', surveyError)
    throw surveyError
  }

  if (!surveys?.length) return {}

  // 2. Récupère les code_insee des communes concernées
  const uniqueIds = [...new Set(surveys.map(s => s.commune_id as string))]
  const { data: communes, error: communeError } = await supabase
    .from('communes')
    .select('id, code_insee')
    .in('id', uniqueIds)

  if (communeError) {
    console.error('[communesService] fetchActiveSurveysCountByCommune communes error:', communeError)
    throw communeError
  }

  // 3. UUID → code_insee puis comptage
  const idToCode: Record<string, string> = {}
  for (const c of communes ?? []) {
    if (c.id && c.code_insee) idToCode[c.id] = c.code_insee
  }

  const counts: Record<string, number> = {}
  for (const s of surveys) {
    const code = idToCode[s.commune_id as string]
    if (code) counts[code] = (counts[code] ?? 0) + 1
  }

  return counts
}
