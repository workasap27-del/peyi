<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSurveysStore } from '@/stores/surveys'
import { mockSurveys } from '@/data/mockSurveys'

const router = useRouter()
const store = useSurveysStore()
const tab = ref<'global' | 'commune'>('global')

onMounted(async () => {
  if (!store.surveys.length) await store.loadSurveys()
})

const allSurveys = computed(() => store.surveys.length ? store.surveys : mockSurveys)

const globalSurveys = computed(() =>
  allSurveys.value.filter(s => !s.commune_id).sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
)

const communeSurveys = computed(() =>
  allSurveys.value.filter(s => !!s.commune_id).sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
)

function responseCount(surveyId: string): number {
  return store.getResponses(surveyId).length
}

function progressPct(surveyId: string): number {
  return Math.min(100, Math.round((responseCount(surveyId) / 500) * 100))
}

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return d }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">📊 Sondages citoyens</h1>
      <p class="text-gray-500 text-sm mt-1">
        Participez aux enquêtes locales. Résultats ventilés par commune, âge et genre.
      </p>
    </div>

    <!-- Onglets -->
    <div class="flex gap-2 mb-6 border-b border-gray-100">
      <button
        class="px-4 py-2 text-sm font-medium transition border-b-2 -mb-px"
        :class="tab === 'global' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="tab = 'global'"
      >
        Guadeloupe
      </button>
      <button
        class="px-4 py-2 text-sm font-medium transition border-b-2 -mb-px"
        :class="tab === 'commune' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="tab = 'commune'"
      >
        Par commune
      </button>
    </div>

    <!-- Chargement -->
    <div v-if="store.loading" class="grid md:grid-cols-2 gap-4">
      <div v-for="i in 3" :key="i" class="h-40 bg-gray-100 rounded-xl animate-pulse" />
    </div>

    <!-- Onglet Guadeloupe -->
    <div v-else-if="tab === 'global'">
      <div v-if="globalSurveys.length" class="grid md:grid-cols-2 gap-4">
        <div
          v-for="survey in globalSurveys"
          :key="survey.id"
          class="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition"
        >
          <!-- Badges -->
          <div class="flex items-center justify-between mb-3">
            <span
              v-if="survey.is_active"
              class="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 tracking-wider"
            >EN COURS</span>
            <span
              v-else
              class="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 tracking-wider"
            >TERMINÉ</span>
            <span v-if="store.hasAnswered(survey.id)" class="text-xs text-emerald-600 font-medium">✓ Répondu</span>
          </div>

          <!-- Titre -->
          <h2 class="font-semibold text-sm leading-snug mb-1">{{ survey.title }}</h2>
          <p v-if="survey.description" class="text-xs text-gray-500 line-clamp-2 mb-3">{{ survey.description }}</p>

          <!-- Répondants + progression (actif) -->
          <template v-if="survey.is_active">
            <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>{{ responseCount(survey.id) }} répondants</span>
              <span>objectif 500</span>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div
                class="h-full bg-emerald-400 rounded-full transition-all"
                :style="{ width: progressPct(survey.id) + '%' }"
              />
            </div>
            <button
              class="w-full py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition active:scale-[0.98]"
              :class="{ 'opacity-60 cursor-default': store.hasAnswered(survey.id) }"
              @click="!store.hasAnswered(survey.id) && router.push(`/participer/${survey.id}`)"
            >
              {{ store.hasAnswered(survey.id) ? '✓ Déjà répondu' : 'Participer →' }}
            </button>
          </template>

          <!-- Terminé -->
          <template v-else>
            <p class="text-xs text-gray-400 mb-3">
              Clôturé {{ survey.ends_at ? formatDate(survey.ends_at) : '' }} · {{ responseCount(survey.id) }} répondants
            </p>
            <button
              class="w-full py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              @click="router.push(`/sondages/${survey.id}`)"
            >
              Voir les résultats
            </button>
          </template>
        </div>
      </div>
      <div v-else class="text-center py-16 text-gray-400">
        Aucun sondage actif pour le moment.
      </div>
    </div>

    <!-- Onglet Par commune -->
    <div v-else>
      <div v-if="communeSurveys.length" class="grid md:grid-cols-2 gap-4">
        <div
          v-for="survey in communeSurveys"
          :key="survey.id"
          class="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition"
        >
          <div class="flex items-center justify-between mb-3">
            <span
              v-if="survey.is_active"
              class="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 tracking-wider"
            >EN COURS</span>
            <span
              v-else
              class="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 tracking-wider"
            >TERMINÉ</span>
            <span class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {{ survey.commune?.name ?? 'Commune' }}
            </span>
          </div>

          <h2 class="font-semibold text-sm leading-snug mb-1">{{ survey.title }}</h2>
          <p v-if="survey.description" class="text-xs text-gray-500 line-clamp-2 mb-3">{{ survey.description }}</p>

          <template v-if="survey.is_active">
            <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>{{ responseCount(survey.id) }} répondants</span>
              <span>objectif 500</span>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div
                class="h-full bg-emerald-400 rounded-full transition-all"
                :style="{ width: progressPct(survey.id) + '%' }"
              />
            </div>
            <button
              class="w-full py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition active:scale-[0.98]"
              :class="{ 'opacity-60 cursor-default': store.hasAnswered(survey.id) }"
              @click="!store.hasAnswered(survey.id) && router.push(`/participer/${survey.id}`)"
            >
              {{ store.hasAnswered(survey.id) ? '✓ Déjà répondu' : 'Participer →' }}
            </button>
          </template>
          <template v-else>
            <p class="text-xs text-gray-400 mb-3">
              Clôturé {{ survey.ends_at ? formatDate(survey.ends_at) : '' }} · {{ responseCount(survey.id) }} répondants
            </p>
            <button
              class="w-full py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              @click="router.push(`/sondages/${survey.id}`)"
            >
              Voir les résultats
            </button>
          </template>
        </div>
      </div>
      <div v-else class="text-center py-16 text-gray-400">
        Aucun sondage communal pour le moment.
      </div>
    </div>
  </div>
</template>
