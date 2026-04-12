import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CommuneStat } from '@/data/communeStats'
import { COMMUNE_DATA, NOM_TO_CODE, participationColor } from '@/data/communeStats'

export const useCommunesStore = defineStore('communes', () => {
  /** Participation counts fetched from Supabase (commune displayName → count) */
  const remoteCounts = ref<Record<string, number>>({})
  /** Active surveys count per commune_id from Supabase */
  const activeSurveyCounts = ref<Record<string, number>>({})
  const loaded = ref(false)
  const loading = ref(false)

  async function loadParticipation() {
    if (loading.value) return
    loading.value = true
    try {
      const { fetchParticipationByCommune, fetchActiveSurveysCountByCommune } = await import('@/services/communesService')
      const [participation, activeSurveys] = await Promise.all([
        fetchParticipationByCommune(),
        fetchActiveSurveysCountByCommune(),
      ])
      remoteCounts.value = participation
      activeSurveyCounts.value = activeSurveys
    } catch {
      // Silently fall back to zero remote counts — static extraCount still applies
    } finally {
      loaded.value = true
      loading.value = false
    }
  }

  const communeStats = computed<CommuneStat[]>(() => {
    // remote counts are keyed by commune displayName (as stored in demographics)
    // NOM_TO_CODE maps displayName → code INSEE
    const countByCode: Record<string, number> = {}
    for (const [name, count] of Object.entries(remoteCounts.value)) {
      const code = NOM_TO_CODE[name]
      if (code) countByCode[code] = (countByCode[code] ?? 0) + count
    }

    const stats: CommuneStat[] = Object.entries(COMMUNE_DATA).map(([code, d]) => {
      const fromRemote = countByCode[code] ?? 0
      const participantCount = fromRemote + (d.extraCount ?? 0)
      // activeSurveyCount: sum of active surveys linked to this commune (keyed by commune_id uuid)
      // For now we use 0 since we'd need to map code → uuid; will be enriched if commune_id matches
      return {
        code,
        displayName: d.displayName,
        participantCount,
        activeSurveyCount: 0, // enriched via commune uuid lookup if available
      }
    })

    return stats
  })

  const statsByCode = computed(() =>
    Object.fromEntries(communeStats.value.map(s => [s.code, s]))
  )

  return { loaded, loading, communeStats, statsByCode, loadParticipation, participationColor }
})
