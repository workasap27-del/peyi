import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CommuneStat } from '@/data/communeStats'
import { COMMUNE_DATA, NOM_TO_CODE, participationColor, circleRadius } from '@/data/communeStats'

export const useCommunesStore = defineStore('communes', () => {
  /** Participation counts fetched from Supabase (commune displayName → count) */
  const remoteCounts = ref<Record<string, number>>({})
  /** Active surveys count per commune_id from Supabase */
  const activeSurveyCounts = ref<Record<string, number>>({})
  const loaded = ref(false)
  const loading = ref(false)
  /** Code INSEE de la commune à animer (pulse vert) après soumission */
  const pulseCode = ref<string | null>(null)
  /** Maximum participation count across all communes (for relative coloring) */
  const maxCount = ref(0)

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
      // Compute maxCount for relative participation thresholds
      const counts = Object.values(participation)
      maxCount.value = counts.length > 0 ? Math.max(...counts) : 0
    } catch {
      // Silently fall back to zero remote counts
    } finally {
      loaded.value = true
      loading.value = false
    }
  }

  /**
   * Appelé après soumission d'une réponse.
   * Recharge les données et mémorise la commune pour la pulse animation.
   * @param communeName - nom de la commune (depuis demographics), ou null
   */
  async function triggerRefresh(communeName: string | null) {
    pulseCode.value = communeName ? (NOM_TO_CODE[communeName] ?? null) : null
    loaded.value = false // force re-render de la carte
    await loadParticipation()
    // Reset pulse après 3s
    setTimeout(() => { pulseCode.value = null }, 3000)
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
      // Uniquement les données réelles Supabase — aucune donnée fictive
      const participantCount = countByCode[code] ?? 0
      return {
        code,
        displayName: d.displayName,
        participantCount,
        activeSurveyCount: 0,
      }
    })

    return stats
  })

  const statsByCode = computed(() =>
    Object.fromEntries(communeStats.value.map(s => [s.code, s]))
  )

  return { loaded, loading, pulseCode, maxCount, communeStats, statsByCode, loadParticipation, triggerRefresh, participationColor, circleRadius }
})
