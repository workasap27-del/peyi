<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSurveysStore } from '@/stores/surveys'

const router = useRouter()
const store = useSurveysStore()

const showArchives = ref(false)
const profileCommune = ref('')

onMounted(async () => {
  if (!store.surveys.length) await store.loadSurveys()
  try {
    const saved = localStorage.getItem('peyi_citizen_profile')
    if (saved) {
      const p = JSON.parse(saved)
      if (p.commune) profileCommune.value = p.commune
    }
  } catch { /* ignore */ }
})

// ── Helpers ────────────────────────────────────────────────────────────────────
function responseCount(id: string) { return store.getResponses(id).length }

function timeLeftLabel(endsAt: string | null): string | null {
  if (!endsAt) return null
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / 86400000)
  if (days > 30) return null
  if (days > 0) return `Ferme dans ${days}j`
  const h = Math.floor(diff / 3600000)
  return `Ferme dans ${h}h`
}

function progressPct(n: number) { return Math.min(100, Math.round((n / 500) * 100)) }

function categoryBadge(title: string): { icon: string; bg: string; label: string } {
  const t = title.toLowerCase()
  if (t.includes('eau') || t.includes('potable')) return { icon: '💧', bg: 'bg-blue-500', label: 'Eau' }
  if (t.includes('transport') || t.includes('bus') || t.includes('mobilit')) return { icon: '🚌', bg: 'bg-orange-500', label: 'Transport' }
  if (t.includes('emploi') || t.includes('travail') || t.includes('chomage')) return { icon: '💼', bg: 'bg-violet-500', label: 'Emploi' }
  if (t.includes('sant') || t.includes('médec') || t.includes('hôpital')) return { icon: '❤️', bg: 'bg-red-500', label: 'Santé' }
  if (t.includes('logement') || t.includes('loyer') || t.includes('habitat')) return { icon: '🏠', bg: 'bg-yellow-500', label: 'Logement' }
  if (t.includes('sécurité') || t.includes('securit') || t.includes('crime')) return { icon: '🛡️', bg: 'bg-gray-600', label: 'Sécurité' }
  if (t.includes('éduc') || t.includes('ecole') || t.includes('école')) return { icon: '📚', bg: 'bg-indigo-500', label: 'Éducation' }
  return { icon: '🗳️', bg: 'bg-emerald-500', label: 'Citoyen' }
}

function reliabilityBadge(n: number): { label: string; bg: string } {
  if (n >= 500) return { label: 'Représentatif ★', bg: 'bg-emerald-500' }
  if (n >= 200) return { label: 'Résultats fiables ✓', bg: 'bg-blue-500' }
  if (n >= 50)  return { label: 'Tendance en cours 📊', bg: 'bg-amber-500' }
  return { label: 'Début de l\'enquête 🌱', bg: 'bg-gray-500' }
}

function baroIcon(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('eau')) return '💧'
  if (t.includes('emploi') || t.includes('travail')) return '💼'
  if (t.includes('confiance') || t.includes('maire')) return '🏛️'
  if (t.includes('économ') || t.includes('situa')) return '📈'
  if (t.includes('jeun') || t.includes('avenir')) return '🌱'
  if (t.includes('transport')) return '🚌'
  if (t.includes('recommand') || t.includes('install')) return '🏡'
  return '📊'
}

// ── Computed ──────────────────────────────────────────────────────────────────
const isPermanent = (s: any) =>
  s.recurrence_type === 'permanent_quarterly' || s.description?.includes('permanent_quarterly')

// Tous les sondages globaux actifs (commune_id = null)
const globalActive = computed(() =>
  store.surveys.filter(s => !s.commune_id && s.is_active !== false)
)

// Sondage du moment : premier actif non-permanent global
const heroSurvey = computed(() =>
  globalActive.value
    .filter(s => !isPermanent(s))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null
)

// Baromètres permanents trimestriels
const barometreSurveys = computed(() =>
  store.surveys
    .filter(s => isPermanent(s))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
)

// Sondages "En cours" (globaux actifs hors hero et baromètres)
const activeOtherSurveys = computed(() =>
  globalActive.value
    .filter(s => !isPermanent(s) && s.id !== heroSurvey.value?.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
)

// Archives
const closedSurveys = computed(() =>
  store.surveys
    .filter(s => s.is_active === false)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
)
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-24">

    <!-- ── EN-TÊTE ──────────────────────────────────────────────────────────── -->
    <div class="bg-white px-4 pt-6 pb-4 border-b border-gray-100">
      <h1 class="text-2xl font-bold text-gray-900">Sondages citoyens</h1>
      <p class="text-gray-500 text-sm mt-1">Vos opinions façonnent la Guadeloupe de demain.</p>
      <p v-if="profileCommune" class="text-xs text-emerald-600 font-medium mt-2">
        📍 Votre commune : {{ profileCommune }}
      </p>
    </div>

    <!-- Chargement -->
    <div v-if="store.loading" class="px-4 pt-6 space-y-4">
      <div class="h-52 bg-gray-200 rounded-2xl animate-pulse" />
      <div class="h-36 bg-gray-100 rounded-2xl animate-pulse" />
      <div class="h-36 bg-gray-100 rounded-2xl animate-pulse" />
    </div>

    <template v-else>
      <div class="px-4 pt-4 space-y-6">

        <!-- HERO : Sondage du moment -->
        <div
          v-if="heroSurvey"
          class="rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-800 to-emerald-600 text-white p-6 shadow-lg"
        >
          <div class="flex items-center justify-between">
            <span
              class="text-[10px] font-bold px-2 py-1 rounded-full text-white uppercase tracking-wider"
              :class="categoryBadge(heroSurvey.title).bg"
            >{{ categoryBadge(heroSurvey.title).icon }} {{ categoryBadge(heroSurvey.title).label }}</span>
            <span
              class="text-[10px] font-bold px-2 py-1 rounded-full text-white"
              :class="reliabilityBadge(responseCount(heroSurvey.id)).bg"
            >{{ reliabilityBadge(responseCount(heroSurvey.id)).label }}</span>
          </div>

          <h2 class="text-white font-bold text-xl leading-snug mt-3 mb-4">{{ heroSurvey.title }}</h2>

          <div class="h-3 bg-white/20 rounded-full overflow-hidden">
            <div class="h-full bg-white/80 rounded-full transition-all" :style="{ width: progressPct(responseCount(heroSurvey.id)) + '%' }" />
          </div>
          <p class="text-white/70 text-sm mt-1.5">{{ responseCount(heroSurvey.id) }} voix</p>

          <button
            class="w-full py-3 mt-4 rounded-full font-semibold text-sm transition active:scale-[0.98]"
            :class="store.hasAnswered(heroSurvey.id)
              ? 'bg-white/20 text-white cursor-default'
              : 'bg-white text-emerald-700 hover:bg-emerald-50'"
            @click="!store.hasAnswered(heroSurvey.id) && router.push(`/participer/${heroSurvey.id}`)"
          >{{ store.hasAnswered(heroSurvey.id) ? '✓ Déjà répondu' : 'Donner mon avis →' }}</button>

          <p
            class="text-white/60 text-sm text-center mt-2 cursor-pointer underline"
            @click="router.push(`/sondages/${heroSurvey.id}`)"
          >Voir les tendances</p>
        </div>

        <!-- BAROMÈTRE PÉYI -->
        <div v-if="barometreSurveys.length">
          <div class="flex items-center gap-2 mb-3">
            <h2 class="text-gray-900 font-bold text-lg">Baromètre Péyi</h2>
            <span class="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Permanent</span>
          </div>
          <div
            class="flex overflow-x-auto scroll-smooth snap-x snap-mandatory gap-4 pb-2 -mx-4 px-4"
            style="scrollbar-width: none; -ms-overflow-style: none;"
          >
            <div
              v-for="s in barometreSurveys"
              :key="s.id"
              class="snap-start flex-shrink-0 w-48 h-40 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer active:scale-95 transition"
              @click="router.push(`/sondages/${s.id}`)"
            >
              <div class="text-4xl leading-none">{{ baroIcon(s.title) }}</div>
              <p class="text-gray-800 font-medium text-sm mt-1.5 line-clamp-2 leading-snug">{{ s.title }}</p>
              <span class="inline-block mt-2 text-[10px] rounded-full px-2 py-0.5 bg-emerald-50 text-emerald-600 font-medium">Baromètre permanent</span>
              <p class="font-bold text-base mt-1"
                 :class="responseCount(s.id) > 0 ? 'text-emerald-600' : 'text-gray-400'">
                {{ responseCount(s.id) > 0 ? responseCount(s.id) + ' voix' : 'En cours' }}
              </p>
            </div>
          </div>
        </div>

        <!-- EN COURS -->
        <div v-if="activeOtherSurveys.length">
          <div class="flex items-center gap-2 mb-3">
            <h2 class="text-gray-900 font-bold text-lg">En cours</h2>
            <span class="text-xs text-gray-400 font-medium">{{ activeOtherSurveys.length }}</span>
          </div>
          <div
            v-for="s in activeOtherSurveys"
            :key="s.id"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-3 transition-all active:scale-[0.98]"
          >
            <div class="flex justify-between items-center">
              <span class="text-[10px] font-bold px-2 py-1 rounded-full text-white uppercase tracking-wider"
                    :class="categoryBadge(s.title).bg">
                {{ categoryBadge(s.title).icon }} {{ categoryBadge(s.title).label }}
              </span>
              <span class="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase">EN COURS</span>
            </div>
            <h3 class="text-gray-900 font-bold text-base leading-snug mt-2 mb-3">{{ s.title }}</h3>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full" :style="{ width: progressPct(responseCount(s.id)) + '%' }" />
            </div>
            <p class="text-gray-400 text-xs mt-1 mb-3">
              {{ responseCount(s.id) }} voix
              <span v-if="timeLeftLabel(s.ends_at ?? null)" class="text-amber-600"> · {{ timeLeftLabel(s.ends_at ?? null) }}</span>
            </p>
            <button
              class="w-full py-3 rounded-full font-semibold text-sm transition active:scale-[0.98]"
              :class="store.hasAnswered(s.id) ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-emerald-600 text-white hover:bg-emerald-700'"
              @click="!store.hasAnswered(s.id) && router.push(`/participer/${s.id}`)"
            >{{ store.hasAnswered(s.id) ? '✓ Déjà répondu' : 'Participer →' }}</button>
          </div>
        </div>

        <!-- ARCHIVES repliées -->
        <div v-if="closedSurveys.length">
          <button
            class="w-full flex items-center justify-between py-3 border-t border-gray-200 text-gray-500 hover:text-gray-700 transition text-sm font-medium"
            @click="showArchives = !showArchives"
          >
            <span>Sondages terminés ({{ closedSurveys.length }})</span>
            <span>{{ showArchives ? '▲' : '▼' }}</span>
          </button>
          <div v-if="showArchives" class="space-y-2 pb-2">
            <div
              v-for="s in closedSurveys"
              :key="s.id"
              class="flex justify-between items-center py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 rounded-lg px-2 transition"
              @click="router.push(`/sondages/${s.id}`)"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-[10px] shrink-0 bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium uppercase">TERMINÉ</span>
                <p class="text-gray-700 text-sm truncate">{{ s.title }}</p>
              </div>
              <div class="flex items-center gap-3 shrink-0 ml-2">
                <span class="text-emerald-600 font-semibold text-sm">{{ responseCount(s.id) }} voix</span>
                <span class="text-emerald-600 text-xs underline">Résultats →</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Vide -->
        <div
          v-if="!heroSurvey && !barometreSurveys.length && !activeOtherSurveys.length"
          class="text-center py-16 text-gray-400 text-sm"
        >
          Aucun sondage en cours.
        </div>

      </div>
    </template>

  </div>
</template>
