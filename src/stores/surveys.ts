import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Survey, SurveyResponse, SurveyResponseInsert } from '@/types'
import { mockSurveys, mockResponses } from '@/data/mockSurveys'
import { getOrCreateRespondentId } from '@/lib/utils'
import { supabase } from '@/services/supabase'

export const useSurveysStore = defineStore('surveys', () => {
  const surveys = ref<Survey[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Responses from Supabase + any new local submissions this session
  const remoteResponses = ref<SurveyResponse[]>([])
  const localSubmissions = ref<SurveyResponse[]>([])
  const answeredIds = ref<Set<string>>(new Set())

  const allResponses = () => [...remoteResponses.value, ...localSubmissions.value]

  async function loadSurveys(_commune_id?: string) {
    loading.value = true
    error.value = null
    try {
      const { supabase } = await import('@/services/supabase')
      // Note: scope global/local géré via commune_id (null = global Guadeloupe, non-null = commune spécifique)
      const { data, error: err } = await supabase
        .from('surveys')
        .select('*, commune:communes(id, name, code_insee, department, lat, lng)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (err) throw err
      // Use Supabase data if surveys exist, else fall back to mock (demo mode)
      surveys.value = data?.length ? (data as Survey[]) : mockSurveys
    } catch {
      surveys.value = mockSurveys
      error.value = 'Mode démo — connexion Supabase indisponible'
    } finally {
      loading.value = false
    }
  }

  async function loadResponses(survey_id: string) {
    try {
      const { supabase } = await import('@/services/supabase')
      const { data } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', survey_id)

      if (data?.length) {
        // Merge without duplicates
        const existingIds = new Set(remoteResponses.value.map(r => r.id))
        for (const r of data as SurveyResponse[]) {
          if (!existingIds.has(r.id)) remoteResponses.value.push(r)
        }
      } else {
        // No remote data — seed with mock responses for this survey for demo
        const mocks = mockResponses.filter(r => r.survey_id === survey_id)
        const existingIds = new Set(remoteResponses.value.map(r => r.id))
        for (const r of mocks) {
          if (!existingIds.has(r.id)) remoteResponses.value.push(r)
        }
      }
    } catch {
      // On error, seed with mock responses so results charts are not empty
      const mocks = mockResponses.filter(r => r.survey_id === survey_id)
      const existingIds = new Set(remoteResponses.value.map(r => r.id))
      for (const r of mocks) {
        if (!existingIds.has(r.id)) remoteResponses.value.push(r)
      }
    }
  }

  function getSurveyById(id: string): Survey | undefined {
    return surveys.value.find((s) => s.id === id) ?? mockSurveys.find((s) => s.id === id)
  }

  function getResponses(survey_id: string): SurveyResponse[] {
    return allResponses().filter((r) => r.survey_id === survey_id)
  }

  function hasAnswered(survey_id: string): boolean {
    const respondentId = getOrCreateRespondentId()
    return (
      answeredIds.value.has(survey_id) ||
      allResponses().some(
        (r) => r.survey_id === survey_id && r.respondent_id === respondentId,
      )
    )
  }

  async function submitResponse(payload: SurveyResponseInsert): Promise<void> {
    // Merge saved citizen profile from localStorage into demographics
    let mergedDemographics = { ...payload.demographics }
    try {
      const saved = localStorage.getItem('peyi_citizen_profile')
      if (saved) {
        const profile = JSON.parse(saved)
        // Saved profile fills missing fields; explicit payload values take priority
        mergedDemographics = { ...profile, ...mergedDemographics }
      }
    } catch { /* ignore */ }

    // Use auth.uid() as respondent_id when authenticated, else anonymous fingerprint
    const { data: { user } } = await supabase.auth.getUser()
    const resolvedPayload: SurveyResponseInsert = {
      ...payload,
      respondent_id: user?.id ?? payload.respondent_id,
      demographics: mergedDemographics,
    }
    try {
      const { error: err } = await supabase.from('survey_responses').insert(resolvedPayload)
      if (err) throw err
    } catch {
      // Submission failed silently — still saved locally for immediate display
    }

    localSubmissions.value.push({
      id: crypto.randomUUID(),
      ...resolvedPayload,
      created_at: new Date().toISOString(),
    })
    answeredIds.value.add(payload.survey_id)
  }

  return {
    surveys, loading, error,
    loadSurveys, loadResponses, getSurveyById, getResponses, hasAnswered, submitResponse,
  }
})
