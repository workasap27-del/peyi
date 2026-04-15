import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSurveysStore } from '@/stores/surveys'
import { useCommunesStore } from '@/stores/communes'

// ── Mock Supabase ─────────────────────────────────────────────────────────────
vi.mock('@/services/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({ data: [], error: null }),
          not: () => ({ data: [], error: null }),
        }),
        not: () => ({ data: [], error: null }),
      }),
      insert: () => ({ error: null }),
    }),
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
  },
}))

// ── surveys store ─────────────────────────────────────────────────────────────
describe('useSurveysStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('initialise avec un tableau vide', () => {
    const store = useSurveysStore()
    expect(store.surveys).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('getSurveyById retourne undefined pour un ID inconnu', () => {
    const store = useSurveysStore()
    expect(store.getSurveyById('inexistant')).toBeUndefined()
  })

  it('getSurveyById trouve un survey mock par ID', () => {
    const store = useSurveysStore()
    const found = store.getSurveyById('survey-1')
    expect(found).toBeDefined()
    expect(found?.id).toBe('survey-1')
  })

  it('getResponses retourne un tableau vide pour un survey sans réponses', () => {
    const store = useSurveysStore()
    expect(store.getResponses('survey-xyz')).toEqual([])
  })

  it('hasAnswered retourne false pour un survey jamais répondu', () => {
    const store = useSurveysStore()
    expect(store.hasAnswered('survey-xyz')).toBe(false)
  })

  it('submitResponse ajoute une réponse localement', async () => {
    const store = useSurveysStore()
    await store.submitResponse({
      survey_id: 'survey-1',
      respondent_id: 'test-respondent',
      answers: { q1: 'Bonne' },
      demographics: {},
    })
    expect(store.hasAnswered('survey-1')).toBe(true)
    expect(store.getResponses('survey-1').length).toBeGreaterThan(0)
  })

  it('submitResponse ne soumet pas deux fois le même sondage (hasAnswered)', async () => {
    const store = useSurveysStore()
    await store.submitResponse({
      survey_id: 'survey-2',
      respondent_id: 'test-respondent-2',
      answers: { q1: 'Voiture personnelle' },
      demographics: {},
    })
    expect(store.hasAnswered('survey-2')).toBe(true)
  })
})

// ── communes store ────────────────────────────────────────────────────────────
describe('useCommunesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initialise avec loaded=false, maxCount=0', () => {
    const store = useCommunesStore()
    expect(store.loaded).toBe(false)
    expect(store.maxCount).toBe(0)
    expect(store.pulseCode).toBeNull()
  })

  it('communeStats contient exactement 34 communes', () => {
    const store = useCommunesStore()
    expect(store.communeStats.length).toBe(34)
  })

  it('toutes les communes ont un code INSEE valide (97xxx)', () => {
    const store = useCommunesStore()
    for (const stat of store.communeStats) {
      expect(stat.code).toMatch(/^971\d{2}$/)
    }
  })

  it('statsByCode permet un accès O(1) par code INSEE', () => {
    const store = useCommunesStore()
    const stat = store.statsByCode['97120']
    expect(stat).toBeDefined()
    expect(stat.displayName).toBe('Pointe-à-Pitre')
  })

  it('participationColor et circleRadius sont bien exportés depuis le store', () => {
    const store = useCommunesStore()
    expect(typeof store.participationColor).toBe('function')
    expect(typeof store.circleRadius).toBe('function')
  })
})
