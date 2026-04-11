<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Report } from '@/types'
import { fetchReportById, upvoteReport } from '@/services/reportsService'
import { statusBadgeClass, formatDate } from '@/lib/utils'

const props = defineProps<{ id: string }>()
const router = useRouter()

const report = ref<Report | null>(null)
const loading = ref(true)
const upvoting = ref(false)

onMounted(async () => {
  try {
    report.value = await fetchReportById(props.id)
  } finally {
    loading.value = false
  }
})

async function handleUpvote() {
  if (!report.value || upvoting.value) return
  upvoting.value = true
  try {
    await upvoteReport(report.value.id)
    report.value.upvotes++
  } finally {
    upvoting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <button class="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1" @click="router.back()">
      ← Retour
    </button>

    <div v-if="loading" class="space-y-4">
      <div class="h-8 bg-gray-100 rounded animate-pulse w-3/4" />
      <div class="h-48 bg-gray-100 rounded-xl animate-pulse" />
    </div>

    <div v-else-if="report">
      <div class="flex items-center gap-2 mb-3">
        <span :class="['text-sm font-medium px-3 py-1 rounded-full', statusBadgeClass(report.status)]">
          {{ report.status }}
        </span>
        <span class="text-sm text-gray-500 capitalize">{{ report.category }}</span>
      </div>

      <h1 class="text-2xl font-bold mb-2">{{ report.title }}</h1>
      <p class="text-sm text-gray-500 mb-6">
        {{ report.commune?.name }} · Signalé le {{ formatDate(report.created_at) }}
      </p>

      <p class="text-gray-700 mb-6">{{ report.description }}</p>

      <!-- Photos -->
      <div v-if="report.photos?.length" class="grid grid-cols-2 gap-2 mb-6">
        <img
          v-for="(url, i) in report.photos"
          :key="i"
          :src="url"
          class="w-full h-40 object-cover rounded-xl"
        />
      </div>

      <!-- Placeholder mini-carte -->
      <div class="bg-gray-100 rounded-xl h-48 flex items-center justify-center text-gray-400 text-sm mb-6">
        🗺️ Position : {{ report.lat.toFixed(5) }}, {{ report.lng.toFixed(5) }}
      </div>

      <button
        class="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition"
        :disabled="upvoting"
        @click="handleUpvote"
      >
        👍 Soutenir ce signalement
        <span class="bg-white px-2 py-0.5 rounded-full text-xs">{{ report.upvotes }}</span>
      </button>
    </div>
  </div>
</template>
