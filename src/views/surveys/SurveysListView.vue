<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSurveysStore } from '@/stores/surveys'
import { COMMUNE_DATA } from '@/data/communeStats'

const router = useRouter()
const store = useSurveysStore()

const filterCommune = ref('')
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

/** Retourne le label de fermeture seulement si < 30 jours, sinon null */
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
const isGlobalMode = computed(() => filterCommune.value === '')

const communeOptions = computed(() =>
  Object.values(COMMUNE_DATA).map(c => c.displayName).sort()
)

const isPermanent = (s: any) =>
  s.recurrence_type === 'permanent_quarterly' || s.description?.includes('permanent_quarterly')

// Sondages globaux actifs (commune_id = null)
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

// Sondages communaux selon filtre
const communalSurveys = computed(() => {
  if (!filterCommune.value) {
    // Mode global : tous les sondages communaux actifs
    return store.surveys
      .filter(s => !!s.commune_id && s.is_active !== false)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  // Mode commune : seulement la commune sélectionnée
  return store.surveys
    .filter(s => !!s.commune_id && s.is_active !== false && s.commune?.name === filterCommune.value)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

// Archives
const closedSurveys = computed(() =>
  store.surveys
    .filter(s => s.is_active === false)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
)

// Nombre de sondages de la commune du profil
const profileCommuneSurveysCount = computed(() =>
  profileCommune.value
    ? store.surveys.filter(s => s.is_active !== false && s.commune?.name === profileCommune.value).length
    : 0
)
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-24">

    <!-- ── EN-TÊTE ──────────────────────────────────────────────────────────── -->
    <div class="bg-white px-4 pt-6 pb-3">
      <h1 class="text-2xl font-bold text-gray-900">Sondages citoyens</h1>
      <p class="text-gray-500 text-sm mt-1">Vos opinions façonnent la Guadeloupe de demain.</p>
    </div>

    <!-- ── BARRE FILTRE GÉOGRAPHIQUE sticky ───────────────────────────────── -->
    <div class="sticky top-0 bg-white z-10 shadow-sm px-4 py-3 flex items-center gap-3">

      <!-- Pill active -->
      <button
        v-if="isGlobalMode"
        class="flex items-center gap-1.5 bg-emerald-600 text-white rounded-full px-4 py-2 text-sm font-medium shrink-0 transition"
      >
        🌍 Toute la Guadeloupe
      </button>
      <div v-else class="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 rounded-full pl-4 pr-2 py-2 text-sm font-medium shrink-0">
        <span class="truncate max-w-[140px]">📍 {{ filterCommune }}</span>
        <button
          class="ml-1 w-5 h-5 rounded-full bg-emerald-200 hover:bg-emerald-300 text-emerald-700 flex items-center justify-center text-xs font-bold transition shrink-0"
          @click="filterCommune = ''"
          aria-label="Réinitialiser le filtre"
        >×</button>
      </div>

      <!-- Dropdown commune -->
      <div class="relative flex-1 min-w-0">
        <select
          :value="filterCommune"
          class="w-full appearance-none border border-gray-200 rounded-full px-4 py-2 text-sm bg-white focus:outline-none focus:border-emerald-400 text-gray-600 pr-8 cursor-pointer"
          @change="filterCommune = ($event.target as HTMLSelectElement).value"
        >
          <option value="">📍 Filtrer par commune</option>
          <option v-for="c in communeOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
      </div>
    </div>

    <!-- Indicateur commune du profil -->
    <div v-if="profileCommune" class="px-4 py-2 bg-white border-b border-gray-100">
      <p class="text-xs text-gray-400">
        Votre commune : <span class="font-medium text-gray-600">{{ profileCommune }}</span>
        <span v-if="profileCommuneSurveysCount > 0" class="ml-1 text-emerald-600 font-semibold">
          · {{ profileCommuneSurveysCount }} sondage{{ profileCommuneSurveysCount !== 1 ? 's' : '' }} en cours
        </span>
        <button
          v-if="filterCommune !== profileCommune"
          class="ml-2 text-emerald-600 underline text-xs"
          @click="filterCommune = profileCommune"
        >Filtrer →</button>
      </p>
    </div>

    <!-- Chargement -->
    <div v-if="store.loading" class="px-4 pt-6 space-y-4">
      <div class="h-52 bg-gray-200 rounded-2xl animate-pulse" />
      <div class="h-36 bg-gray-100 rounded-2xl animate-pulse" />
      <div class="h-36 bg-gray-100 rounded-2xl animate-pulse" />
    </div>

    <template v-else>

      <!-- ══════════════════════════════════════════════════════════════════════
           MODE COMMUNE — communaux d'abord, puis globaux avec séparateur
      ══════════════════════════════════════════════════════════════════════ -->
      <template v-if="!isGlobalMode">
        <div class="px-4 pt-5 space-y-4">

          <!-- Sondages de la commune -->
          <div v-if="communalSurveys.length" class="space-y-3">
            <h2 class="text-gray-900 font-bold text-lg">
              📍 {{ filterCommune }}
              <span class="ml-2 text-sm font-normal text-gray-500">{{ communalSurveys.length }} sondage{{ communalSurveys.length !== 1 ? 's' : '' }}</span>
            </h2>
            <div
              v-for="s in communalSurveys"
              :key="s.id"
              class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold px-2 py-1 rounded-full text-white uppercase"
                      :class="categoryBadge(s.title).bg">
                  {{ categoryBadge(s.title).icon }} {{ categoryBadge(s.title).label }}
                </span>
                <span class="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-600">📍 Local</span>
              </div>
              <h3 class="text-gray-900 font-bold text-base leading-snug mt-2 mb-3">{{ s.title }}</h3>
              <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div class="h-full bg-emerald-500 rounded-full" :style="{ width: progressPct(responseCount(s.id)) + '%' }" />
              </div>
              <p class="text-gray-400 text-xs mb-3">
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

          <!-- Pas de sondage local -->
          <div v-else class="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <p class="text-2xl mb-2">🏝️</p>
            <p class="text-gray-500 text-sm">Aucun sondage local pour <strong>{{ filterCommune }}</strong>.</p>
          </div>

          <!-- Séparateur : sondages globaux -->
          <div class="flex items-center gap-3 pt-2">
            <div class="flex-1 h-px bg-gray-200" />
            <span class="text-xs text-gray-400 font-medium shrink-0">Sondages pour toute la Guadeloupe</span>
            <div class="flex-1 h-px bg-gray-200" />
          </div>

        </div>
      </template>

      <!-- ══════════════════════════════════════════════════════════════════════
           CONTENU COMMUN (global + globaux en mode commune)
      ══════════════════════════════════════════════════════════════════════ -->
      <div class="px-4 pt-4 space-y-6">

        <!-- HERO : Sondage du moment -->
        <div
          v-if="heroSurvey"
          class="rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-800 to-emerald-600 text-white p-6 shadow-lg"
        >
          <!-- Badges haut -->
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

          <!-- Titre -->
          <h2 class="text-white font-bold text-xl leading-snug mt-3 mb-4">{{ heroSurvey.title }}</h2>

          <!-- Progression sans objectif -->
          <div class="h-3 bg-white/20 rounded-full overflow-hidden">
            <div class="h-full bg-white/80 rounded-full transition-all" :style="{ width: progressPct(responseCount(heroSurvey.id)) + '%' }" />
          </div>
          <p class="text-white/70 text-sm mt-1.5">{{ responseCount(heroSurvey.id) }} voix</p>

          <!-- Bouton participer -->
          <button
            class="w-full py-3 mt-4 rounded-full font-semibold text-sm transition active:scale-[0.98]"
            :class="store.hasAnswered(heroSurvey.id)
              ? 'bg-white/20 text-white cursor-default'
              : 'bg-white text-emerald-700 hover:bg-emerald-50'"
            @click="!store.hasAnswered(heroSurvey.id) && router.push(`/participer/${heroSurvey.id}`)"
          >{{ store.hasAnswered(heroSurvey.id) ? '✓ Déjà répondu' : 'Donner mon avis →' }}</button>

          <!-- Lien résultats -->
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

        <!-- EN COURS (autres sondages globaux actifs) -->
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

        <!-- SONDAGES COMMUNAUX (mode global uniquement) -->
        <div v-if="isGlobalMode && communalSurveys.length">
          <h2 class="text-gray-900 font-bold text-lg mb-3">Sondages locaux</h2>
          <div
            v-for="s in communalSurveys"
            :key="s.id"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-3 active:scale-[0.98] transition"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="text-[10px] font-bold px-2 py-1 rounded-full text-white uppercase"
                    :class="categoryBadge(s.title).bg">
                {{ categoryBadge(s.title).icon }} {{ categoryBadge(s.title).label }}
              </span>
              <span class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">📍 {{ s.commune?.name ?? 'Local' }}</span>
            </div>
            <h3 class="text-gray-900 font-bold text-base leading-snug mt-1 mb-3">{{ s.title }}</h3>
            <div class="flex gap-2">
              <button
                class="flex-1 py-2.5 rounded-full text-sm font-semibold transition active:scale-[0.98]"
                :class="store.hasAnswered(s.id) ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-emerald-600 text-white hover:bg-emerald-700'"
                @click="!store.hasAnswered(s.id) && router.push(`/participer/${s.id}`)"
              >{{ store.hasAnswered(s.id) ? '✓ Répondu' : 'Participer →' }}</button>
              <button
                class="px-4 py-2.5 rounded-full text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                @click="router.push(`/sondages/${s.id}`)"
              >Résultats</button>
            </div>
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
          v-if="!heroSurvey && !barometreSurveys.length && !activeOtherSurveys.length && !communalSurveys.length"
          class="text-center py-16 text-gray-400 text-sm"
        >
          Aucun sondage en cours.
        </div>

      </div>
    </template>

  </div>
</template>
