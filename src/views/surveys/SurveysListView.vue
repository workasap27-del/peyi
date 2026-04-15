<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSurveysStore } from '@/stores/surveys'

const router = useRouter()
const store = useSurveysStore()
const tab = ref<'global' | 'commune'>('global')
const selectedCommune = ref('')
const profileCommune = ref('')

onMounted(async () => {
  if (!store.surveys.length) await store.loadSurveys()
  // Lire la commune du profil citoyen persistant
  try {
    const saved = localStorage.getItem('peyi_citizen_profile')
    if (saved) {
      const p = JSON.parse(saved)
      if (p.commune) {
        profileCommune.value = p.commune
        selectedCommune.value = p.commune
      }
    }
  } catch { /* ignore */ }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function responseCount(id: string) { return store.getResponses(id).length }
function progressPct(n: number) { return Math.min(100, Math.round((n / 500) * 100)) }

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return d }
}

function timeLeft(endsAt: string | null): string {
  if (!endsAt) return 'Sans limite'
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return 'Clôturé'
  const days = Math.floor(diff / 86400000)
  // Si plus de 30 jours, afficher la date en clair
  if (days > 30) {
    return 'Ouvert jusqu\'au ' + new Date(endsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  const rh = h % 24
  if (d > 0) return `${d}j ${rh}h`
  return `${h}h`
}

// Sondages de la commune du profil actifs
const communeActiveSurveys = computed(() =>
  profileCommune.value
    ? store.surveys.filter(s => !!s.commune_id && s.commune?.name === profileCommune.value && s.is_active !== false)
    : []
)

function goToCommune() {
  tab.value = 'commune'
  selectedCommune.value = profileCommune.value
}

// Badge catégorie selon mots-clés dans le titre
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

// Score fiabilité reformulé (orienté citoyen)
function reliabilityBadge(n: number): { label: string; bg: string } {
  if (n >= 500) return { label: 'Représentatif ★', bg: 'bg-emerald-500' }
  if (n >= 200) return { label: 'Résultats fiables ✓', bg: 'bg-blue-500' }
  if (n >= 50)  return { label: 'Tendance en cours 📊', bg: 'bg-amber-500' }
  return { label: 'Début de l\'enquête 🌱', bg: 'bg-gray-500' }
}

// ── Données calculées ─────────────────────────────────────────────────────────

const allSurveys = computed(() => store.surveys)

const heroSurvey = computed(() =>
  allSurveys.value
    .filter(s => !s.commune_id && s.is_active !== false && !s.description?.includes('permanent_quarterly'))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null
)

const barometreSurveys = computed(() =>
  allSurveys.value
    .filter(s => s.description?.includes('permanent_quarterly'))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
)

const otherActiveSurveys = computed(() =>
  allSurveys.value
    .filter(s => s.is_active !== false && !s.commune_id
      && s.id !== heroSurvey.value?.id
      && !s.description?.includes('permanent_quarterly'))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
)

const closedSurveys = computed(() =>
  allSurveys.value
    .filter(s => s.is_active === false && !s.commune_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
)

const availableCommunes = computed(() => {
  const names = new Set<string>()
  allSurveys.value.filter(s => !!s.commune_id && s.commune?.name).forEach(s => names.add(s.commune!.name))
  return Array.from(names).sort()
})

const communeSurveys = computed(() =>
  allSurveys.value
    .filter(s => !!s.commune_id && (!selectedCommune.value || s.commune?.name === selectedCommune.value))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
)

// Icône thème baromètre
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
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-24">

    <!-- ── EN-TÊTE ──────────────────────────────────────────────────────────── -->
    <div class="bg-white px-4 pt-6 pb-3">
      <h1 class="text-2xl font-bold text-gray-900">Sondages citoyens</h1>
      <p class="text-gray-500 text-[15px] mt-1">Vos opinions façonnent la Guadeloupe de demain.</p>
    </div>

    <!-- ── ONGLETS sticky ──────────────────────────────────────────────────── -->
    <div class="sticky top-0 bg-white z-10 border-b border-gray-100 flex px-4">
      <button
        class="py-3 text-[15px] font-medium border-b-2 transition mr-6"
        :class="tab === 'global' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500'"
        @click="tab = 'global'"
      >Guadeloupe</button>
      <button
        class="py-3 text-[15px] font-medium border-b-2 transition"
        :class="tab === 'commune' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500'"
        @click="tab = 'commune'"
      >Par commune</button>
    </div>

    <!-- ── Bannière commune du profil ─────────────────────────────────────── -->
    <div class="px-4 pt-3">
      <div v-if="profileCommune" class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-2">
        <p class="text-emerald-800 text-[15px] font-medium">
          📍 <span class="font-bold">{{ communeActiveSurveys.length }}</span>
          sondage{{ communeActiveSurveys.length !== 1 ? 's' : '' }} en cours dans votre commune —
          <span class="font-semibold">{{ profileCommune }}</span>
        </p>
        <button
          class="shrink-0 text-emerald-700 font-bold text-sm underline"
          @click="goToCommune"
        >Voir</button>
      </div>
      <p v-else class="text-gray-400 text-sm italic">
        Renseignez votre commune dans votre profil pour voir les sondages locaux.
      </p>
    </div>

    <!-- Chargement -->
    <div v-if="store.loading" class="px-4 pt-6 space-y-4">
      <div class="h-52 bg-gray-200 rounded-2xl animate-pulse" />
      <div class="h-36 bg-gray-100 rounded-2xl animate-pulse" />
      <div class="h-36 bg-gray-100 rounded-2xl animate-pulse" />
    </div>

    <!-- ── ONGLET GUADELOUPE ────────────────────────────────────────────────── -->
    <template v-else-if="tab === 'global'">
      <div class="px-4 pt-5 space-y-6">

        <!-- HERO : Sondage du moment -->
        <div v-if="heroSurvey" class="rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-800 to-emerald-600 text-white p-6 shadow-lg">
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

          <!-- Progression -->
          <div class="h-2 bg-white/20 rounded-full overflow-hidden">
            <div class="h-full bg-white/80 rounded-full transition-all" :style="{ width: progressPct(responseCount(heroSurvey.id)) + '%' }" />
          </div>
          <p class="text-white/70 text-[15px] mt-1">{{ responseCount(heroSurvey.id) }} voix · objectif 500</p>

          <!-- Bouton principal -->
          <button
            class="w-full py-3 mt-4 rounded-full font-semibold text-[15px] transition active:scale-[0.98]"
            :class="store.hasAnswered(heroSurvey.id)
              ? 'bg-white/20 text-white cursor-default'
              : 'bg-white text-emerald-700 hover:bg-emerald-50'"
            @click="!store.hasAnswered(heroSurvey.id) && router.push(`/participer/${heroSurvey.id}`)"
          >{{ store.hasAnswered(heroSurvey.id) ? '✓ Déjà répondu' : 'Donner mon avis →' }}</button>

          <!-- Lien résultats -->
          <p
            class="text-white/60 text-[15px] underline text-center mt-2 cursor-pointer"
            @click="router.push(`/sondages/${heroSurvey.id}`)"
          >Voir les tendances actuelles</p>
        </div>

        <!-- BAROMÈTRE -->
        <div v-if="barometreSurveys.length">
          <h2 class="text-gray-900 font-bold text-lg mb-3">Le pouls de la Guadeloupe</h2>
          <div class="flex overflow-x-auto scroll-smooth snap-x snap-mandatory gap-4 pb-2 -mx-4 px-4"
               style="scrollbar-width: none; -ms-overflow-style: none;">
            <div
              v-for="s in barometreSurveys"
              :key="s.id"
              class="snap-start flex-shrink-0 w-48 h-36 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer active:scale-95 transition"
              @click="router.push(`/sondages/${s.id}`)"
            >
              <div class="text-3xl">{{ baroIcon(s.title) }}</div>
              <p class="text-gray-800 font-medium text-sm mt-1 line-clamp-2 leading-snug">{{ s.title }}</p>
              <p class="font-bold text-lg mt-1"
                 :class="responseCount(s.id) > 0 ? 'text-emerald-600' : 'text-gray-400'">
                {{ responseCount(s.id) > 0 ? responseCount(s.id) + ' voix' : 'En cours' }}
              </p>
            </div>
          </div>
        </div>

        <!-- AUTRES ACTIFS -->
        <div v-if="otherActiveSurveys.length">
          <h2 class="text-gray-900 font-bold text-lg mb-3">En cours</h2>
          <div
            v-for="s in otherActiveSurveys"
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
            <h3 class="text-gray-900 font-bold text-[15px] leading-snug mt-2 mb-3">{{ s.title }}</h3>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full" :style="{ width: progressPct(responseCount(s.id)) + '%' }" />
            </div>
            <p class="text-gray-400 text-xs mt-1">{{ responseCount(s.id) }} avis · finit dans {{ timeLeft(s.ends_at ?? null) }}</p>
            <button
              class="w-full py-2.5 mt-3 rounded-full font-medium text-[15px] transition active:scale-[0.98]"
              :class="store.hasAnswered(s.id)
                ? 'bg-gray-100 text-gray-400 cursor-default'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'"
              @click="!store.hasAnswered(s.id) && router.push(`/participer/${s.id}`)"
            >{{ store.hasAnswered(s.id) ? '✓ Déjà répondu' : 'Participer →' }}</button>
          </div>
        </div>

        <!-- ARCHIVES -->
        <div v-if="closedSurveys.length">
          <h2 class="text-gray-900 font-bold text-lg mb-2">Sondages terminés</h2>
          <div
            v-for="s in closedSurveys"
            :key="s.id"
            class="flex justify-between items-center py-3 border-b border-gray-100 cursor-pointer"
            @click="router.push(`/sondages/${s.id}`)"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-[10px] shrink-0 bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium uppercase">TERMINÉ</span>
              <p class="text-gray-700 text-[15px] truncate">{{ s.title }}</p>
            </div>
            <div class="flex items-center gap-3 shrink-0 ml-2">
              <span class="text-emerald-600 font-semibold text-[15px]">{{ responseCount(s.id) }} voix</span>
              <span class="text-emerald-600 text-xs underline">Résultats →</span>
            </div>
          </div>
        </div>

        <div v-if="!heroSurvey && !otherActiveSurveys.length && !closedSurveys.length && !barometreSurveys.length"
             class="text-center py-16 text-gray-400 text-[15px]">
          Aucun sondage pour le moment.
        </div>
      </div>
    </template>

    <!-- ── ONGLET PAR COMMUNE ─────────────────────────────────────────────── -->
    <template v-else>
      <div class="px-4 pt-5 space-y-4">
        <select
          v-model="selectedCommune"
          class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[15px] bg-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">Toutes les communes</option>
          <option v-for="c in availableCommunes" :key="c" :value="c">{{ c }}</option>
        </select>

        <div v-if="communeSurveys.length" class="space-y-3">
          <div
            v-for="s in communeSurveys"
            :key="s.id"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all active:scale-[0.98]"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="text-[10px] font-bold px-2 py-1 rounded-full text-white uppercase"
                    :class="s.is_active !== false ? 'bg-emerald-500' : 'bg-gray-400'">
                {{ s.is_active !== false ? 'EN COURS' : 'TERMINÉ' }}
              </span>
              <span class="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">📍 {{ s.commune?.name ?? 'Commune' }}</span>
            </div>
            <h3 class="text-gray-900 font-bold text-[15px] leading-snug mb-3">{{ s.title }}</h3>

            <template v-if="s.is_active !== false">
              <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div class="h-full bg-emerald-500 rounded-full" :style="{ width: progressPct(responseCount(s.id)) + '%' }" />
              </div>
              <p class="text-gray-400 text-xs mb-3">{{ responseCount(s.id) }} avis · finit dans {{ timeLeft(s.ends_at ?? null) }}</p>
              <button
                class="w-full py-2.5 rounded-full font-medium text-[15px] transition active:scale-[0.98]"
                :class="store.hasAnswered(s.id) ? 'bg-gray-100 text-gray-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'"
                @click="!store.hasAnswered(s.id) && router.push(`/participer/${s.id}`)"
              >{{ store.hasAnswered(s.id) ? '✓ Déjà répondu' : 'Participer →' }}</button>
            </template>
            <template v-else>
              <p class="text-xs text-gray-400 mb-3">Clôturé {{ s.ends_at ? formatDate(s.ends_at) : '' }} · {{ responseCount(s.id) }} répondants</p>
              <button
                class="w-full py-2.5 rounded-full border border-gray-200 text-gray-600 text-[15px] font-medium hover:bg-gray-50 transition"
                @click="router.push(`/sondages/${s.id}`)"
              >Voir les résultats</button>
            </template>
          </div>
        </div>

        <div v-else class="text-center py-16 text-gray-400 text-[15px]">
          Aucun sondage communal{{ selectedCommune ? ` pour ${selectedCommune}` : '' }}.
        </div>
      </div>
    </template>

  </div>
</template>
