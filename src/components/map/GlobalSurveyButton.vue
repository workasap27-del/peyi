<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSurveysStore } from '@/stores/surveys'

const router = useRouter()
const store = useSurveysStore()

onMounted(async () => {
  if (!store.surveys.length) await store.loadSurveys()
})

// Sondages flash uniquement (recurrence_type flash_daily ou null/undefined)
// Exclut les baromètres trimestriels permanent_quarterly
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
const hasActive = computed(() => activeSurvey.value !== null)

function participate() {
  if (activeSurvey.value) {
    router.push(`/participer/${activeSurvey.value.id}`)
  }
}
</script>

<template>
  <!-- Bouton flottant centré, au-dessus de la bottom nav (bottom-[57px]) -->
  <div class="absolute bottom-[68px] inset-x-0 z-[1500] flex justify-center pointer-events-none px-4">
    <button
      v-if="hasActive"
      class="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm text-white transition active:scale-[0.97]"
      style="background: #065f46;"
      @click="participate"
    >
      <span>🗳️</span>
      <span>Répondre au sondage du moment</span>
    </button>
    <div
      v-else
      class="pointer-events-none px-5 py-3 rounded-2xl text-sm text-white/60 font-medium"
      style="background: rgba(0,0,0,0.4);"
    >
      Aucun sondage global en cours
    </div>
  </div>
</template>
