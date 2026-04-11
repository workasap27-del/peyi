<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useReportsStore } from '@/stores/reports'
import { useCommune } from '@/composables/useCommune'
import { statusBadgeClass, timeAgo } from '@/lib/utils'
import type { ReportCategory, ReportStatus } from '@/types'

const reportsStore = useReportsStore()
const { communes } = useCommune()
const showForm = ref(false)

const categories: ReportCategory[] = ['voirie', 'eau', 'déchets', 'éclairage', 'végétation', 'autre']
const statuses: ReportStatus[] = ['ouvert', 'en_cours', 'résolu', 'rejeté']

onMounted(() => reportsStore.loadReports())
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">📍 Signalements citoyens</h1>
      <button
        class="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        @click="showForm = true"
      >
        + Signaler un problème
      </button>
    </div>

    <!-- Filtres -->
    <div class="flex flex-wrap gap-3 mb-6">
      <select
        class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
        v-model="reportsStore.filterCommune"
        @change="reportsStore.loadReports()"
      >
        <option :value="null">Toute la Guadeloupe</option>
        <option v-for="c in communes" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>

      <select
        class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
        v-model="reportsStore.filterCategory"
        @change="reportsStore.loadReports()"
      >
        <option :value="null">Toutes catégories</option>
        <option v-for="cat in categories" :key="cat" :value="cat" class="capitalize">{{ cat }}</option>
      </select>

      <select
        class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
        v-model="reportsStore.filterStatus"
        @change="reportsStore.loadReports()"
      >
        <option :value="null">Tous statuts</option>
        <option v-for="s in statuses" :key="s" :value="s" class="capitalize">{{ s }}</option>
      </select>
    </div>

    <!-- Placeholder carte (Leaflet monté via composant dédié) -->
    <div class="bg-gray-100 rounded-2xl h-72 flex items-center justify-center text-gray-400 text-sm mb-6 border-2 border-dashed border-gray-200">
      🗺️ Carte Leaflet — sera montée dans ReportMap.vue
    </div>

    <!-- Liste signalements -->
    <div v-if="reportsStore.loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-20 bg-gray-100 rounded-xl animate-pulse" />
    </div>

    <div v-else-if="reportsStore.reports.length" class="space-y-3">
      <RouterLink
        v-for="report in reportsStore.reports"
        :key="report.id"
        :to="`/signalements/${report.id}`"
        class="flex items-start gap-4 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition"
      >
        <div class="text-2xl mt-0.5">
          {{ { voirie: '🛣️', eau: '💧', déchets: '🗑️', éclairage: '💡', végétation: '🌿', autre: '⚠️' }[report.category] }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', statusBadgeClass(report.status)]">
              {{ report.status }}
            </span>
            <span class="text-xs text-gray-400 capitalize">{{ report.category }}</span>
          </div>
          <p class="font-medium text-sm truncate">{{ report.title }}</p>
          <p class="text-xs text-gray-500 mt-0.5">
            {{ report.commune?.name }} · {{ timeAgo(report.created_at) }} · 👍 {{ report.upvotes }}
          </p>
        </div>
      </RouterLink>
    </div>

    <div v-else class="text-center py-16 text-gray-500">
      Aucun signalement pour ces filtres.
    </div>
  </div>
</template>
