<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { CommuneStat } from '@/data/communeStats'
import { heatColor } from '@/data/communeStats'
import { useSurveysStore } from '@/stores/surveys'
import { useAuthStore } from '@/stores/auth'
import { mockSurveys } from '@/data/mockSurveys'
import AuthModal from '@/components/auth/AuthModal.vue'

const props = defineProps<{
  commune: CommuneStat | null
}>()

const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const store = useSurveysStore()
const auth = useAuthStore()

// Auth modal state
const authModalSurveyId = ref<string | null>(null)

// Sondages disponibles pour cette commune (commune spécifique + tous Guadeloupe)
const availableSurveys = computed(() => {
  if (!props.commune) return []
  const surveys = store.surveys.length ? store.surveys : mockSurveys
  return surveys.filter(s =>
    s.commune_id === null ||
    s.commune?.name === props.commune!.displayName
  )
})

const color = computed(() =>
  props.commune ? heatColor(props.commune.heatScore) : '#22c55e'
)

const intensityLabel = computed(() => {
  const s = props.commune?.opinionScore ?? 0
  if (s < 0.35) return { text: 'Opinion calme', emoji: '😌' }
  if (s < 0.6) return { text: 'Avis mitigés', emoji: '🤔' }
  if (s < 0.8) return { text: 'Préoccupations fortes', emoji: '😟' }
  return { text: 'Situation critique', emoji: '🚨' }
})

function startSurvey(surveyId: string) {
  if (!auth.isAuthenticated) {
    authModalSurveyId.value = surveyId
  } else {
    router.push(`/participer/${surveyId}`)
  }
}

function onAuthSuccess() {
  const id = authModalSurveyId.value
  authModalSurveyId.value = null
  if (id) router.push(`/participer/${id}`)
}
</script>

<template>
  <Transition name="panel">
    <div
      v-if="commune"
      class="fixed inset-x-0 bottom-0 z-[2000] bg-white rounded-t-2xl shadow-2xl"
      style="max-height: 70vh; overflow-y: auto;"
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
              <span class="text-lg">{{ intensityLabel.emoji }}</span>
              <span class="text-sm font-medium" :style="{ color }">
                {{ intensityLabel.text }}
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

        <!-- Stats rapides -->
        <div class="grid grid-cols-3 gap-3 mt-4">
          <div class="bg-gray-50 rounded-xl p-3 text-center">
            <div class="text-xl font-bold" :style="{ color }">{{ commune.participantCount }}</div>
            <div class="text-xs text-gray-500 mt-0.5">répondants</div>
          </div>
          <div class="bg-gray-50 rounded-xl p-3 text-center">
            <div class="text-xl font-bold text-gray-800">{{ availableSurveys.length }}</div>
            <div class="text-xs text-gray-500 mt-0.5">sondages actifs</div>
          </div>
          <div class="bg-gray-50 rounded-xl p-3 text-center">
            <div class="text-xl font-bold text-gray-800">
              {{ Math.round(commune.heatScore * 100) }}
            </div>
            <div class="text-xs text-gray-500 mt-0.5">score activité</div>
          </div>
        </div>

        <!-- Barre d'intensité -->
        <div class="mt-3">
          <div class="flex justify-between text-xs text-gray-400 mb-1">
            <span>😌 Calme</span>
            <span>Sujet : <strong class="text-gray-700">{{ commune.topTopic }}</strong></span>
            <span>🚨 Critique</span>
          </div>
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="{ width: (commune.heatScore * 100) + '%', backgroundColor: color }"
            />
          </div>
        </div>
      </div>

      <!-- Sondages disponibles -->
      <div class="px-5 py-4">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Participer aux sondages
        </p>

        <div class="space-y-3">
          <button
            v-for="survey in availableSurveys"
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
                  {{ survey.questions.length }} questions · ~{{ Math.ceil(survey.questions.length * 0.5) }} min
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

        <div v-if="!availableSurveys.length" class="text-center py-6 text-gray-400 text-sm">
          Aucun sondage actif pour cette commune.
        </div>
      </div>

      <!-- Espace pour la bottom nav -->
      <div class="h-6" />
    </div>
  </Transition>

  <!-- Auth Modal -->
  <AuthModal
    v-if="authModalSurveyId"
    :survey-id="authModalSurveyId"
    @success="onAuthSuccess"
    @close="authModalSurveyId = null"
  />

  <!-- Overlay -->
  <Transition name="fade">
    <div
      v-if="commune && !authModalSurveyId"
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
