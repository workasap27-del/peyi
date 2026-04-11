import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CommuneStat } from '@/data/communeStats'
import { COMMUNE_DATA, NOM_TO_CODE, heatColor } from '@/data/communeStats'

export const useCommunesStore = defineStore('communes', () => {
  /** Participation counts fetched from Supabase (commune displayName → count) */
  const remoteCounts = ref<Record<string, number>>({})
  const loaded = ref(false)
  const loading = ref(false)

  async function loadParticipation() {
    if (loading.value) return
    loading.value = true
    try {
      const { fetchParticipationByCommune } = await import('@/services/communesService')
      remoteCounts.value = await fetchParticipationByCommune()
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
      return {
        code,
        nom: code,
        displayName: d.displayName,
        participantCount,
        opinionScore: d.opinionScore,
        heatScore: 0,
        topTopic: d.topTopic,
      }
    })

    const maxCount = Math.max(...stats.map(s => s.participantCount), 1)
    for (const s of stats) {
      const normalizedCount = s.participantCount / maxCount
      s.heatScore = normalizedCount * 0.45 + s.opinionScore * 0.55
    }

    return stats
  })

  const statsByCode = computed(() =>
    Object.fromEntries(communeStats.value.map(s => [s.code, s]))
  )

  return { loaded, loading, communeStats, statsByCode, loadParticipation, heatColor }
})
