<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { CommuneStat } from '@/data/communeStats'
import { participationColor } from '@/data/communeStats'
import { useSurveysStore } from '@/stores/surveys'
import { useCommunesStore } from '@/stores/communes'
import type { Survey } from '@/types'
import { supabase } from '@/services/supabase'

const props = defineProps<{ commune: CommuneStat | null }>()
const emit = defineEmits<{ close: [] }>()
const router = useRouter()
const store = useSurveysStore()
const communesStore = useCommunesStore()

const communeDbId = ref<string | null>(null)

watch(() => props.commune, async (c) => {
  if (!c) return
  const { data } = await supabase
    .from('communes')
    .select('id')
    .eq('code_insee', c.code)
    .single()
  communeDbId.value = data?.id ?? null
}, { immediate: true })

// Sondages spécifiques à cette commune uniquement (scope=commune)
const localSurveys = computed<Survey[]>(() => {
  if (!communeDbId.value || !store.surveys.length) return []
  return store.surveys
    .filter(s => s.commune_id === communeDbId.value)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

const participationRate = computed(() => {
  if (!props.commune) return 0
  return Math.min(100, Math.round((props.commune.participantCount / 50000) * 100 * 10) / 10)
})

const color = computed(() => props.commune ? participationColor(props.commune.participantCount, communesStore.maxCount) : '#6b7280')

/** Temps estimé : nb questions × 12s, arrondi à la minute supérieure */
function estimatedTime(questions: any[]): string {
  const mins = Math.max(1, Math.ceil((questions.length * 12) / 60))
  return `~${mins} min`
}

function startSurvey(id: string) {
  router.push(`/participer/${id}`)
}
</script>

<template>
  <Transition name="panel">
    <div
      v-if="commune"
      class="fixed inset-x-0 bottom-0 z-[2000] bg-white rounded-t-2xl shadow-2xl"
      style="max-height: 75vh; overflow-y: auto;"
    >
      <!-- Handle -->
      <div class="flex justify-center pt-3 pb-1">
        <div class="w-10 h-1 rounded-full bg-gray-200" />
      </div>

      <!-- En-tête commune -->
      <div class="px-5 pt-3 pb-4 border-b border-gray-100">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-bold">{{ commune.displayName }}</h2>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-sm font-medium" :style="{ color }">
                {{ commune.participantCount }} répondant{{ commune.participantCount !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>
          <button
            class="p-2 rounded-full hover:bg-gray-100 text-gray-400"
            @click="emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Barre de participation -->
        <div class="mt-4">
          <div class="flex justify-between text-xs text-gray-400 mb-1">
            <span>Participation citoyenne</span>
            <span class="font-semibold" :style="{ color }">{{ participationRate }}%</span>
          </div>
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="{ width: participationRate + '%', backgroundColor: color }"
            />
          </div>
        </div>
      </div>

      <!-- Sondages locaux uniquement -->
      <div class="px-5 pt-4 pb-8">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Sondages {{ commune.displayName }}
        </p>

        <div v-if="localSurveys.length" class="space-y-3">
          <button
            v-for="survey in localSurveys"
            :key="survey.id"
            class="w-full text-left bg-gray-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 rounded-xl p-4 transition group"
            :class="{ 'opacity-60': store.hasAnswered(survey.id) }"
            @click="!store.hasAnswered(survey.id) && startSurvey(survey.id)"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="font-medium text-sm group-hover:text-emerald-700 transition leading-snug">
                  {{ survey.title }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ survey.questions.length }} questions · {{ estimatedTime(survey.questions) }}
                  · {{ store.getResponses(survey.id).length }} répondants
                </p>
              </div>
              <div class="ml-3 shrink-0">
                <span v-if="store.hasAnswered(survey.id)" class="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
                  ✓ Fait
                </span>
                <div v-else class="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white group-hover:bg-emerald-700 transition">
                  →
                </div>
              </div>
            </div>
          </button>
        </div>

        <p v-else class="text-sm text-gray-400 italic py-3">
          Aucun sondage local en cours pour {{ commune.displayName }} — revenez bientôt
        </p>
      </div>
    </div>
  </Transition>

  <!-- Overlay -->
  <Transition name="fade">
    <div
      v-if="commune"
      class="fixed inset-0 bg-black/30 z-[1999]"
      @click="emit('close')"
    />
  </Transition>
</template>

<style scoped>
.panel-enter-active, .panel-leave-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}
.panel-enter-from, .panel-leave-to {
  transform: translateY(100%);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
