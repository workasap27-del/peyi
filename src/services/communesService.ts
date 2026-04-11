import { supabase } from './supabase'

/** Retourne le nombre de réponses par code INSEE des communes */
export async function fetchParticipationByCommune(): Promise<Record<string, number>> {
  // Agrège les demographics->>'commune' depuis survey_responses
  // On compte par nom de commune (champ demographics.commune) puis on mappe sur le code INSEE
  const { data, error } = await supabase
    .from('survey_responses')
    .select('demographics')

  if (error) throw error

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const commune = (row.demographics as { commune?: string })?.commune
    if (commune) counts[commune] = (counts[commune] ?? 0) + 1
  }
  return counts
}
