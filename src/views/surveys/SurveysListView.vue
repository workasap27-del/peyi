<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSurveysStore } from '@/stores/surveys'

const router = useRouter()
const store = useSurveysStore()
const tab = ref<'global' | 'commune'>('global')
const selectedCommune = ref('')

onMounted(async () => {
  if (!store.surveys.length) await store.loadSurveys()
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function responseCount(surveyId: string): number {
  return store.getResponses(surveyId).length
}

function progressPct(n: number): number {
  return Math.min(100, Math.round((n / 500) * 100))
}

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return d }
}

function timeLeft(endsAt: string | null): string {
  if (!endsAt) return 'En cours'
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return 'Clôturé'
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `${h}h restantes`
  return `${Math.floor(h / 24)}j restants`
}

function reliabilityScore(n: number): { score: string; label: string; color: string } {
  if (n >= 500) return { score: 'A', label: 'Très fiable', color: 'text-emerald-600 bg-emerald-50' }
  if (n >= 200) return { score: 'B', label: 'Fiable', color: 'text-blue-600 bg-blue-50' }
  if (n >= 50)  return { score: 'C', label: 'Indicatif', color: 'text-amber-600 bg-amber-50' }
  return { score: 'D', label: 'Faible', color: 'text-red-500 bg-red-50' }
}

// ── Données calculées ─────────────────────────────────────────────────────────

const allSurveys = computed(() => store.surveys)

// Sondage du moment : actif global le plus récent
const heroSurvey = computed(() =>
  allSurveys.value
    .filter(s => !s.commune_id && s.is_active !== false)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null
)

// Baromètre permanent : description contient "permanent_quarterly"
const barometeSurveys = computed(() =>
  allSurveys.value.filter(s => s.description?.includes('permanent_quarterly'))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
)

// Autres actifs globaux (hors hero et permanent)
const otherActiveSurveys = computed(() =>
  allSurveys.value
    .filter(s => s.is_active !== false && !s.commune_id && s.id !== heroSurvey.value?.id && !s.description?.includes('permanent_quarterly'))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
)

// Archives (terminés, globaux)
const closedSurveys = computed(() =>
  allSurveys.value
    .filter(s => s.is_active === false && !s.commune_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
)

// Communes disponibles
const availableCommunes = computed(() => {
  const names = new Set<string>()
  allSurveys.value.filter(s => !!s.commune_id && s.commune?.name).forEach(s => names.add(s.commune!.name))
  return Array.from(names).sort()
})

// Sondages par commune filtrés
const communeSurveys = computed(() =>
  allSurveys.value
    .filter(s => !!s.commune_id && (!selectedCommune.value || s.commune?.name === selectedCommune.value))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
)

// Totaux baromètre
const baroTotal = computed(() =>
  barometeSurveys.value.reduce((sum, s) => sum + responseCount(s.id), 0)
)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6 pb-24">

    <!-- ── HERO : Sondage du moment ────────────────────────────────────────── -->
    <div v-if="heroSurvey" class="mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-700 to-emerald-900 text-white shadow-lg">
      <div class="px-6 pt-6 pb-2">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded-full uppercase">Sondage du moment</span>
          <span class="text-xs text-emerald-200">{{ timeLeft(heroSurvey.ends_at ?? null) }}</span>
        </div>
        <h2 class="text-xl font-bold leading-snug mb-2">{{ heroSurvey.title }}</h2>
        <p v-if="heroSurvey.description && !heroSurvey.description.includes('permanent')" class="text-sm text-emerald-100 mb-4 line-clamp-2">{{ heroSurvey.description }}</p>
      </div>

      <!-- Barre de progression -->
      <div class="px-6 mb-4">
        <div class="flex justify-between text-xs text-emerald-200 mb-1">
          <span>{{ responseCount(heroSurvey.id) }} répondants</span>
          <span>objectif 500</span>
        </div>
        <div class="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            class="h-full bg-white rounded-full transition-all"
            :style="{ width: progressPct(responseCount(heroSurvey.id)) + '%' }"
          />
        </div>
      </div>

      <div class="px-6 pb-6">
        <button
          class="w-full py-3 rounded-xl font-bold text-sm transition active:scale-[0.98]"
          :class="store.hasAnswered(heroSurvey.id)
            ? 'bg-white/20 text-white cursor-default'
            : 'bg-white text-emerald-800 hover:bg-emerald-50'"
          @click="!store.hasAnswered(heroSurvey.id) && router.push(`/participer/${heroSurvey.id}`)"
        >
          {{ store.hasAnswered(heroSurvey.id) ? '✓ Déjà répondu · Voir les résultats' : 'Participer maintenant →' }}
        </button>
      </div>
    </div>

    <!-- ── BAROMÈTRE PÉYI ──────────────────────────────────────────────────── -->
    <div v-if="barometeSurveys.length" class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <h2 class="text-base font-bold text-gray-800">📈 Baromètre Péyi</h2>
        <span class="text-xs text-gray-400">Questions permanentes trimestrielles</span>
        <span class="ml-auto text-xs text-gray-400">{{ baroTotal }} répondants cumulés</span>
      </div>
      <div class="grid md:grid-cols-2 gap-3">
        <div
          v-for="survey in barometeSurveys"
          :key="survey.id"
          class="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition cursor-pointer"
          @click="router.push(`/sondages/${survey.id}`)"
        >
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium leading-snug line-clamp-2 mb-2">{{ survey.title }}</p>
              <div class="flex items-center gap-2">
                <span
                  class="text-xs font-bold px-1.5 py-0.5 rounded"
                  :class="reliabilityScore(responseCount(survey.id)).color"
                >{{ reliabilityScore(responseCount(survey.id)).score }}</span>
                <span class="text-xs text-gray-400">{{ responseCount(survey.id) }} répondants</span>
                <span v-if="survey.is_active !== false" class="text-xs text-emerald-600 font-medium">• en cours</span>
              </div>
            </div>
            <span class="text-gray-300 text-lg mt-0.5">›</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── ONGLETS ─────────────────────────────────────────────────────────── -->
    <div class="flex gap-2 mb-5 border-b border-gray-100">
      <button
        class="px-4 py-2 text-sm font-medium transition border-b-2 -mb-px"
        :class="tab === 'global' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="tab = 'global'"
      >Guadeloupe</button>
      <button
        class="px-4 py-2 text-sm font-medium transition border-b-2 -mb-px"
        :class="tab === 'commune' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="tab = 'commune'"
      >Par commune</button>
    </div>

    <!-- Chargement -->
    <div v-if="store.loading" class="grid md:grid-cols-2 gap-4">
      <div v-for="i in 4" :key="i" class="h-36 bg-gray-100 rounded-xl animate-pulse" />
    </div>

    <!-- ── ONGLET GUADELOUPE ───────────────────────────────────────────────── -->
    <template v-else-if="tab === 'global'">

      <!-- Autres sondages actifs -->
      <div v-if="otherActiveSurveys.length" class="mb-8">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Sondages en cours</h3>
        <div class="grid md:grid-cols-2 gap-4">
          <div
            v-for="survey in otherActiveSurveys"
            :key="survey.id"
            class="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 tracking-wider">EN COURS</span>
              <span class="text-xs text-gray-400">{{ timeLeft(survey.ends_at ?? null) }}</span>
            </div>
            <h2 class="font-semibold text-sm leading-snug mb-3">{{ survey.title }}</h2>
            <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>{{ responseCount(survey.id) }} répondants</span>
              <span class="font-bold px-1.5 py-0.5 rounded text-xs" :class="reliabilityScore(responseCount(survey.id)).color">
                Score {{ reliabilityScore(responseCount(survey.id)).score }}
              </span>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div class="h-full bg-emerald-400 rounded-full transition-all" :style="{ width: progressPct(responseCount(survey.id)) + '%' }" />
            </div>
            <button
              class="w-full py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition active:scale-[0.98]"
              :class="{ 'opacity-60 cursor-default': store.hasAnswered(survey.id) }"
              @click="!store.hasAnswered(survey.id) && router.push(`/participer/${survey.id}`)"
            >{{ store.hasAnswered(survey.id) ? '✓ Déjà répondu' : 'Participer →' }}</button>
          </div>
        </div>
      </div>

      <!-- Archives -->
      <div v-if="closedSurveys.length">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Archives</h3>
        <div class="space-y-2">
          <div
            v-for="survey in closedSurveys"
            :key="survey.id"
            class="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition cursor-pointer"
            @click="router.push(`/sondages/${survey.id}`)"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium leading-snug line-clamp-2">{{ survey.title }}</p>
              <p class="text-xs text-gray-400 mt-0.5">
                Clôturé {{ survey.ends_at ? formatDate(survey.ends_at) : '' }} · {{ responseCount(survey.id) }} répondants
              </p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs font-bold px-1.5 py-0.5 rounded" :class="reliabilityScore(responseCount(survey.id)).color">
                {{ reliabilityScore(responseCount(survey.id)).score }}
              </span>
              <span class="text-gray-300">›</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!otherActiveSurveys.length && !closedSurveys.length" class="text-center py-16 text-gray-400">
        Aucun sondage pour le moment.
      </div>
    </template>

    <!-- ── ONGLET PAR COMMUNE ─────────────────────────────────────────────── -->
    <template v-else>
      <!-- Filtre commune -->
      <div class="mb-4">
        <select
          v-model="selectedCommune"
          class="w-full md:w-64 border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">Toutes les communes</option>
          <option v-for="c in availableCommunes" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <div v-if="communeSurveys.length" class="grid md:grid-cols-2 gap-4">
        <div
          v-for="survey in communeSurveys"
          :key="survey.id"
          class="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition"
        >
          <div class="flex items-center justify-between mb-2">
            <span
              class="text-xs font-bold px-2 py-0.5 rounded-full tracking-wider"
              :class="survey.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'"
            >{{ survey.is_active !== false ? 'EN COURS' : 'TERMINÉ' }}</span>
            <span class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{{ survey.commune?.name ?? 'Commune' }}</span>
          </div>
          <h2 class="font-semibold text-sm leading-snug mb-3">{{ survey.title }}</h2>

          <template v-if="survey.is_active !== false">
            <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>{{ responseCount(survey.id) }} répondants</span>
              <span>objectif 500</span>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div class="h-full bg-emerald-400 rounded-full transition-all" :style="{ width: progressPct(responseCount(survey.id)) + '%' }" />
            </div>
            <button
              class="w-full py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition active:scale-[0.98]"
              :class="{ 'opacity-60 cursor-default': store.hasAnswered(survey.id) }"
              @click="!store.hasAnswered(survey.id) && router.push(`/participer/${survey.id}`)"
            >{{ store.hasAnswered(survey.id) ? '✓ Déjà répondu' : 'Participer →' }}</button>
          </template>
          <template v-else>
            <p class="text-xs text-gray-400 mb-3">
              Clôturé {{ survey.ends_at ? formatDate(survey.ends_at) : '' }} · {{ responseCount(survey.id) }} répondants
            </p>
            <button
              class="w-full py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              @click="router.push(`/sondages/${survey.id}`)"
            >Voir les résultats</button>
          </template>
        </div>
      </div>
      <div v-else class="text-center py-16 text-gray-400">
        Aucun sondage communal{{ selectedCommune ? ` pour ${selectedCommune}` : '' }}.
      </div>
    </template>

  </div>
</template>
