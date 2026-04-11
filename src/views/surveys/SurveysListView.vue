<script setup lang="ts">
import { onMounted } from 'vue'
import { useSurveysStore } from '@/stores/surveys'
import { RouterLink } from 'vue-router'

const store = useSurveysStore()

onMounted(() => store.loadSurveys())

const categoryIcon: Record<string, string> = {
  'eau': '💧',
  'transport': '🚌',
  'culture': '🎭',
}

function icon(title: string) {
  for (const [k, v] of Object.entries(categoryIcon)) {
    if (title.toLowerCase().includes(k)) return v
  }
  return '📊'
}

function responsesCount(id: string) {
  return store.getResponses(id).length
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">📊 Sondages citoyens</h1>
      <p class="text-gray-500 text-sm mt-1">
        Participez aux enquêtes locales. Résultats ventilés par commune, âge et genre.
      </p>
    </div>

    <!-- Chargement -->
    <div v-if="store.loading" class="grid md:grid-cols-2 gap-4">
      <div v-for="i in 3" :key="i" class="h-40 bg-gray-100 rounded-xl animate-pulse" />
    </div>

    <div v-else-if="store.surveys.length" class="grid md:grid-cols-2 gap-4">
      <RouterLink
        v-for="survey in store.surveys"
        :key="survey.id"
        :to="`/sondages/${survey.id}`"
        class="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition group"
      >
        <!-- En-tête carte -->
        <div class="flex items-start justify-between mb-3">
          <span class="text-3xl">{{ icon(survey.title) }}</span>
          <div class="flex flex-col items-end gap-1">
            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {{ survey.commune?.name ?? 'Toute la Guadeloupe' }}
            </span>
            <span v-if="store.hasAnswered(survey.id)" class="text-xs text-emerald-600 font-medium">
              ✓ Répondu
            </span>
          </div>
        </div>

        <!-- Titre & desc -->
        <h2 class="font-semibold text-sm leading-snug group-hover:text-emerald-700 transition">
          {{ survey.title }}
        </h2>
        <p v-if="survey.description" class="text-xs text-gray-500 mt-1 line-clamp-2">
          {{ survey.description }}
        </p>

        <!-- Pied de carte -->
        <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <span class="text-xs text-gray-400">
            {{ survey.questions.length }} question{{ survey.questions.length > 1 ? 's' : '' }}
          </span>
          <div class="flex items-center gap-1 text-xs text-gray-500">
            <span class="font-semibold text-emerald-700">{{ responsesCount(survey.id) }}</span>
            réponse{{ responsesCount(survey.id) > 1 ? 's' : '' }}
          </div>
        </div>

        <!-- Barre de progression fictive -->
        <div class="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-emerald-400 rounded-full"
            :style="{ width: Math.min((responsesCount(survey.id) / 200) * 100, 100) + '%' }"
          />
        </div>
        <p class="text-right text-xs text-gray-400 mt-0.5">
          objectif 200 participants
        </p>
      </RouterLink>
    </div>

    <div v-else class="text-center py-16 text-gray-400">
      Aucun sondage actif pour le moment.
    </div>
  </div>
</template>
