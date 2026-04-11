import { supabase } from './supabase'
import type { Survey, SurveyResponse, SurveyResponseInsert } from '@/types'

export async function fetchActiveSurveys(commune_id?: string): Promise<Survey[]> {
  let query = supabase
    .from('surveys')
    .select('*, commune:communes(id, name)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (commune_id) {
    query = query.or(`commune_id.eq.${commune_id},commune_id.is.null`)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Survey[]
}

export async function fetchSurveyById(id: string): Promise<Survey> {
  const { data, error } = await supabase
    .from('surveys')
    .select('*, commune:communes(id, name)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Survey
}

export async function submitSurveyResponse(payload: SurveyResponseInsert): Promise<SurveyResponse> {
  const { data, error } = await supabase
    .from('survey_responses')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as SurveyResponse
}

export async function fetchSurveyResults(
  survey_id: string,
): Promise<{ answers: SurveyResponse['answers'][]; count: number }> {
  const { data, error, count } = await supabase
    .from('survey_responses')
    .select('answers', { count: 'exact' })
    .eq('survey_id', survey_id)

  if (error) throw error
  return { answers: (data ?? []).map((r) => r.answers), count: count ?? 0 }
}
