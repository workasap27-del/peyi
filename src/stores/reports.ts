import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Report, ReportCategory, ReportStatus } from '@/types'
import { fetchReports } from '@/services/reportsService'

export const useReportsStore = defineStore('reports', () => {
  const reports = ref<Report[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filterCommune = ref<string | null>(null)
  const filterCategory = ref<ReportCategory | null>(null)
  const filterStatus = ref<ReportStatus | null>(null)

  async function loadReports() {
    loading.value = true
    error.value = null
    try {
      reports.value = await fetchReports({
        commune_id: filterCommune.value ?? undefined,
        category: filterCategory.value ?? undefined,
        status: filterStatus.value ?? undefined,
      })
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return {
    reports, loading, error,
    filterCommune, filterCategory, filterStatus,
    loadReports,
  }
})
