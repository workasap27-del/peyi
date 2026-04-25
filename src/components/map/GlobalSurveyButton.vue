<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSurveysStore } from '@/stores/surveys'

const router = useRouter()
const store = useSurveysStore()

onMounted(async () => {
  if (!store.surveys.length) await store.loadSurveys()
})

const globalSurveys = computed(() =>
  store.surveys
    .filter(s =>
      !s.commune_id &&
      s.is_active !== false &&
      s.recurrence_type !== 'permanent_quarterly'
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
)

const activeSurvey = computed(() => globalSurveys.value[0] ?? null)

const questionLabel = computed(() => {
  const q = activeSurvey.value?.title ?? ''
  return q.length > 60 ? q.slice(0, 60) + '…' : q
})

function participate() {
  if (activeSurvey.value) router.push(`/participer/${activeSurvey.value.id}`)
}
</script>

<template>
  <div class="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1001] max-w-sm w-full px-4">
    <button
      v-if="activeSurvey"
      class="w-full flex items-center gap-3 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-lg transition active:scale-[0.98]"
      @click="participate"
    >
      <span class="text-lg shrink-0">🗳️</span>
      <span class="flex-1 text-sm font-medium text-left leading-snug">{{ questionLabel }}</span>
      <span class="shrink-0 text-base">→</span>
    </button>
  </div>
</template>
