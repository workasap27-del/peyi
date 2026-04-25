<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function openResults(id: string) {
  router.push(`/sondages/${id}`)
}

// ── Auth ──────────────────────────────────────────────────────────────────────
const storedToken = ref(localStorage.getItem('peyi_admin_token') || '')
const passwordInput = ref('')
const isAuthenticated = ref(false)
const authError = ref('')
const authLoading = ref(false)

// Helper : appels API admin avec token dans Authorization header
async function adminFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${storedToken.value}`,
      ...opts.headers,
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

async function authenticate(tok: string) {
  authLoading.value = true
  authError.value = ''
  try {
    const res = await fetch('/api/admin/list-surveys', {
      headers: { Authorization: `Bearer ${tok}` },
    })
    if (res.ok) {
      storedToken.value = tok
      isAuthenticated.value = true
      localStorage.setItem('peyi_admin_token', tok)
    } else {
      authError.value = 'Token invalide'
    }
  } catch {
    authError.value = 'Erreur réseau'
  } finally {
    authLoading.value = false
  }
}

// ── Formulaire ────────────────────────────────────────────────────────────────
const title = ref('')
const scope = ref<'global' | 'quarterly'>('global')
const answerType = ref<'yesno' | 'scale5' | 'multiple' | 'scale10'>('yesno')
const customOptions = ref<string[]>(['', ''])
const duration = ref<'48h' | '7d' | '30d' | 'custom'>('48h')
const customDate = ref('')
const context = ref('')
const publishing = ref(false)
const toast = ref<{ msg: string; type: 'success' | 'error' } | null>(null)

function addOption() {
  if (customOptions.value.length < 6) customOptions.value.push('')
}
function removeOption(i: number) {
  if (customOptions.value.length > 2) customOptions.value.splice(i, 1)
}

const endsAt = computed(() => {
  const now = new Date()
  if (duration.value === '48h') now.setHours(now.getHours() + 48)
  else if (duration.value === '7d') now.setDate(now.getDate() + 7)
  else if (duration.value === '30d') now.setDate(now.getDate() + 30)
  else if (duration.value === 'custom' && customDate.value) return new Date(customDate.value)
  else return null
  return now
})

const endsAtLabel = computed(() => {
  if (!endsAt.value) return ''
  return endsAt.value.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
})

function buildQuestions() {
  if (answerType.value === 'yesno') {
    return [{ id: 'q1', type: 'radio', label: title.value, options: ['Oui', 'Non'] }]
  } else if (answerType.value === 'scale5') {
    return [{ id: 'q1', type: 'scale', label: title.value, min: 1, max: 5 }]
  } else if (answerType.value === 'scale10') {
    return [{ id: 'q1', type: 'scale', label: title.value, min: 1, max: 10 }]
  } else {
    return [{ id: 'q1', type: 'radio', label: title.value, options: customOptions.value.filter(o => o.trim()) }]
  }
}

function showToast(msg: string, type: 'success' | 'error') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 4000)
}

async function publish() {
  if (!title.value.trim()) return
  publishing.value = true
  toast.value = null
  try {
    let description = context.value.trim() || null
    if (scope.value === 'quarterly') {
      description = description ? `${description} — permanent_quarterly` : 'permanent_quarterly'
    }

    await adminFetch('/api/admin/create-survey', {
      method: 'POST',
      body: JSON.stringify({
        title: title.value.trim(),
        description,
        questions: buildQuestions(),
        is_active: true,
        ends_at: endsAt.value?.toISOString() ?? null,
      }),
    })

    showToast('Sondage publié ✓', 'success')
    title.value = ''
    context.value = ''
    customOptions.value = ['', '']
    await loadSurveys()
  } catch (e: any) {
    showToast(e.message ?? 'Erreur publication', 'error')
  } finally {
    publishing.value = false
  }
}

// ── Sondages actifs ───────────────────────────────────────────────────────────
const activeSurveys = ref<any[]>([])
const closedSurveys = ref<any[]>([])
const surveysLoading = ref(false)
const confirmClose = ref<string | null>(null)

async function loadSurveys() {
  surveysLoading.value = true
  try {
    const data = await adminFetch('/api/admin/list-surveys')
    activeSurveys.value = data.active ?? []
    closedSurveys.value = data.closed ?? []
  } catch (e: any) {
    showToast(e.message, 'error')
  } finally {
    surveysLoading.value = false
  }
}

async function closeSurvey(id: string) {
  try {
    await adminFetch('/api/admin/close-survey', {
      method: 'POST',
      body: JSON.stringify({ survey_id: id }),
    })
    confirmClose.value = null
    await loadSurveys()
  } catch (e: any) {
    showToast(e.message, 'error')
  }
}

function timeLeft(endsAt: string | null): string {
  if (!endsAt) return 'Sans limite'
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return 'Expiré'
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  const rh = h % 24
  if (d > 0) return `${d}j ${rh}h`
  return `${h}h`
}

function progressPct(n: number) {
  return Math.min(100, Math.round((n / 500) * 100))
}

// ── Demographics ──────────────────────────────────────────────────────────────
interface DemoRow {
  demographics: {
    age_group?: string
    gender?: string
    commune?: string
    employment_status?: string
    quartier?: string
  } | null
  respondent_id: string
  survey_id: string
}

const demoData = ref<DemoRow[]>([])
const demoLoading = ref(false)

async function loadDemographics() {
  demoLoading.value = true
  try {
    const data = await adminFetch('/api/admin/get-demographics')
    demoData.value = data ?? []
  } catch { /* ignore */ }
  finally { demoLoading.value = false }
}

const totalRespondents = computed(() => {
  const ids = new Set(demoData.value.map(r => r.respondent_id))
  return ids.size
})

function demoCount(key: 'age_group' | 'gender' | 'commune', val: string): number {
  return demoData.value.filter(r => r.demographics?.[key] === val).length
}

function demoPercent(key: 'age_group' | 'gender' | 'commune', val: string): number {
  if (!totalRespondents.value) return 0
  return Math.round((demoCount(key, val) / totalRespondents.value) * 100)
}

const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
const genders = [
  { val: 'homme', label: 'Homme' },
  { val: 'femme', label: 'Femme' },
  { val: 'autre', label: 'Autre / NR' },
]

const topCommunes = computed(() => {
  const counts: Record<string, number> = {}
  for (const r of demoData.value) {
    const c = r.demographics?.commune
    if (c) counts[c] = (counts[c] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, n]) => ({
      name,
      n,
      pct: Math.round((n / totalRespondents.value) * 100),
    }))
})

// ── Montage ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (storedToken.value) {
    await authenticate(storedToken.value)
  }
})

watch(isAuthenticated, async (v) => {
  if (v) {
    await loadSurveys()
    await loadDemographics()
  }
})
</script>

<template>
  <!-- ── ÉCRAN DE BLOCAGE ─────────────────────────────────────────────────── -->
  <div v-if="!isAuthenticated" class="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
    <div class="w-full max-w-sm px-6">
      <div class="mb-8 text-center">
        <div class="text-3xl mb-3">🔒</div>
        <h1 class="text-white text-xl font-bold mb-1">Accès restreint</h1>
        <p class="text-gray-500 text-sm">Interface réservée à l'équipe Péyi</p>
      </div>
      <div class="space-y-3">
        <input
          v-model="passwordInput"
          type="password"
          placeholder="Token d'accès"
          class="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-[#10b981] outline-none transition"
          @keydown.enter="authenticate(passwordInput)"
        />
        <p v-if="authError" class="text-red-400 text-xs text-center">{{ authError }}</p>
        <button
          class="w-full py-3 rounded-xl bg-[#10b981] text-white font-semibold text-sm hover:bg-emerald-400 transition disabled:opacity-40"
          :disabled="authLoading || !passwordInput"
          @click="authenticate(passwordInput)"
        >
          {{ authLoading ? 'Vérification…' : 'Entrer' }}
        </button>
      </div>
    </div>
  </div>

  <!-- ── DASHBOARD ────────────────────────────────────────────────────────── -->
  <div v-else class="min-h-screen bg-[#0a0a0a] text-white">

    <!-- Header -->
    <div class="border-b border-[#1a1a1a] px-6 py-4 flex items-center gap-4">
      <span class="text-lg font-bold tracking-tight">Péyi <span class="text-[#10b981]">Admin</span></span>
      <span class="text-[#2a2a2a]">|</span>
      <span class="text-gray-500 text-sm">{{ new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
      <span class="ml-auto flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
        <span class="text-xs text-gray-500">En ligne</span>
      </span>
    </div>

    <!-- Toast -->
    <transition name="slide-toast">
      <div
        v-if="toast"
        class="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl"
        :class="toast.type === 'success' ? 'bg-[#10b981] text-white' : 'bg-red-500 text-white'"
      >
        {{ toast.msg }}
      </div>
    </transition>

    <!-- Stats bar -->
    <div class="border-b border-[#1a1a1a] px-6 py-3 flex items-center gap-6 overflow-x-auto bg-[#0d0d0d]">
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-[#10b981] text-lg font-bold">{{ totalRespondents }}</span>
        <span class="text-gray-600 text-xs">répondants totaux</span>
      </div>
      <div class="w-px h-4 bg-[#1a1a1a] shrink-0" />
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-white text-lg font-bold">{{ activeSurveys.length }}</span>
        <span class="text-gray-600 text-xs">sondages actifs</span>
      </div>
      <div class="w-px h-4 bg-[#1a1a1a] shrink-0" />
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-gray-400 text-lg font-bold">{{ closedSurveys.length }}</span>
        <span class="text-gray-600 text-xs">clôturés</span>
      </div>
      <div class="w-px h-4 bg-[#1a1a1a] shrink-0" />
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-amber-400 text-lg font-bold">{{ demoData.filter(r => r.demographics?.age_group === '18-24' || r.demographics?.age_group === '25-34').length }}</span>
        <span class="text-gray-600 text-xs">18–34 ans</span>
      </div>
      <div class="ml-auto shrink-0">
        <button
          class="text-xs text-gray-600 hover:text-[#10b981] transition"
          @click="loadDemographics"
        >↻ Actualiser</button>
      </div>
    </div>

    <!-- Corps : 2 colonnes -->
    <div class="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-61px)]">

      <!-- ── COLONNE GAUCHE : Formulaire (60%) ──────────────────────────── -->
      <div class="lg:w-[60%] border-r border-[#1a1a1a] px-6 py-6 space-y-6 lg:overflow-y-auto lg:max-h-[calc(100vh-61px)]">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest">Nouveau sondage</h2>

        <!-- Champ 1 : Titre -->
        <div>
          <label class="text-xs text-gray-400 mb-2 block">Question citoyenne</label>
          <div class="relative">
            <textarea
              v-model="title"
              placeholder="Posez votre question citoyenne..."
              maxlength="120"
              rows="3"
              class="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-[#10b981] outline-none resize-none transition"
            />
            <span class="absolute bottom-3 right-3 text-xs" :class="title.length > 100 ? 'text-amber-400' : 'text-gray-600'">
              {{ title.length }}/120
            </span>
          </div>
        </div>

        <!-- Champ 2 : Scope -->
        <div>
          <label class="text-xs text-gray-400 mb-2 block">Portée du sondage</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in [
                { value: 'global', icon: '🌍', label: 'Toute la Guadeloupe' },
                { value: 'quarterly', icon: '🔁', label: 'Baromètre trimestriel' }
              ]"
              :key="opt.value"
              class="flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-xs font-medium transition"
              :class="scope === opt.value
                ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]'
                : 'border-[#222] bg-[#111] text-gray-400 hover:border-[#333]'"
              @click="scope = opt.value as any"
            >
              <span class="text-lg">{{ opt.icon }}</span>
              <span class="text-center leading-tight">{{ opt.label }}</span>
            </button>
          </div>
        </div>

        <!-- Champ 4 : Type de réponse -->
        <div>
          <label class="text-xs text-gray-400 mb-2 block">Type de réponse</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in [
                { value: 'yesno', icon: '👍', label: 'Oui / Non', preview: 'Oui   Non' },
                { value: 'scale5', icon: '⭐', label: 'Échelle 1 à 5', preview: '1 · 2 · 3 · 4 · 5' },
                { value: 'multiple', icon: '📋', label: 'Choix multiples', preview: 'A / B / C…' },
                { value: 'scale10', icon: '🔢', label: 'Note 1 à 10', preview: '1 ·· 5 ·· 10' },
              ]"
              :key="opt.value"
              class="flex flex-col gap-1.5 px-4 py-3 rounded-xl border text-left transition"
              :class="answerType === opt.value
                ? 'border-[#10b981] bg-[#10b981]/10'
                : 'border-[#222] bg-[#111] hover:border-[#333]'"
              @click="answerType = opt.value as any"
            >
              <div class="flex items-center gap-2">
                <span>{{ opt.icon }}</span>
                <span class="text-xs font-medium" :class="answerType === opt.value ? 'text-[#10b981]' : 'text-gray-300'">{{ opt.label }}</span>
              </div>
              <span class="text-xs text-gray-600 font-mono">{{ opt.preview }}</span>
            </button>
          </div>
        </div>

        <!-- Champ 5 : Options (si choix multiples) -->
        <div v-if="answerType === 'multiple'">
          <label class="text-xs text-gray-400 mb-2 block">Options de réponse</label>
          <div class="space-y-2">
            <div v-for="(_, i) in customOptions" :key="i" class="flex items-center gap-2">
              <span class="text-xs text-gray-600 w-4">{{ i + 1 }}</span>
              <input
                v-model="customOptions[i]"
                type="text"
                :placeholder="`Option ${i + 1}…`"
                class="flex-1 bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#10b981] outline-none transition"
              />
              <button
                v-if="customOptions.length > 2"
                class="text-gray-600 hover:text-red-400 transition text-sm"
                @click="removeOption(i)"
              >✕</button>
            </div>
          </div>
          <button
            v-if="customOptions.length < 6"
            class="mt-2 text-xs text-[#10b981] hover:text-emerald-300 transition"
            @click="addOption"
          >+ Ajouter une option</button>
        </div>

        <!-- Champ 6 : Durée -->
        <div>
          <label class="text-xs text-gray-400 mb-2 block">Durée</label>
          <div class="flex gap-2 mb-2">
            <button
              v-for="opt in [{ v: '48h', l: '48h' }, { v: '7d', l: '7 jours' }, { v: '30d', l: '30 jours' }, { v: 'custom', l: 'Personnalisé' }]"
              :key="opt.v"
              class="px-3 py-2 rounded-lg border text-xs font-medium transition"
              :class="duration === opt.v
                ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]'
                : 'border-[#222] bg-[#111] text-gray-400 hover:border-[#333]'"
              @click="duration = opt.v as any"
            >{{ opt.l }}</button>
          </div>
          <input
            v-if="duration === 'custom'"
            v-model="customDate"
            type="datetime-local"
            class="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#10b981] outline-none transition mb-2"
          />
          <p v-if="endsAtLabel" class="text-xs text-gray-500">
            Se terminera le <span class="text-gray-300">{{ endsAtLabel }}</span>
          </p>
        </div>

        <!-- Champ 7 : Contexte -->
        <div>
          <label class="text-xs text-gray-400 mb-2 block">Contexte <span class="text-gray-600">(optionnel)</span></label>
          <div class="relative">
            <textarea
              v-model="context"
              placeholder="Contexte ou description pour les citoyens (optionnel)"
              maxlength="280"
              rows="2"
              class="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-[#10b981] outline-none resize-none transition"
            />
            <span class="absolute bottom-3 right-3 text-xs text-gray-600">{{ context.length }}/280</span>
          </div>
        </div>

        <!-- Bouton Publier -->
        <button
          class="w-full py-4 rounded-xl font-bold text-sm transition active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed"
          :class="publishing ? 'bg-[#10b981]/60 cursor-wait' : 'bg-[#10b981] hover:bg-emerald-400'"
          :disabled="!title.trim() || publishing"
          @click="publish"
        >
          <span v-if="publishing" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Publication…
          </span>
          <span v-else>🗳️ Publier le sondage</span>
        </button>
      </div>

      <!-- ── COLONNE DROITE : Sondages actifs (40%) ─────────────────────── -->
      <div class="lg:w-[40%] px-6 py-6 space-y-6 lg:overflow-y-auto lg:max-h-[calc(100vh-61px)]">

        <!-- Sondages actifs -->
        <div>
          <div class="flex items-center gap-2 mb-4">
            <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest">Sondages actifs</h2>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981]">
              {{ activeSurveys.length }}
            </span>
          </div>

          <div v-if="surveysLoading" class="space-y-3">
            <div v-for="i in 2" :key="i" class="h-24 bg-[#111] rounded-xl animate-pulse" />
          </div>

          <div v-else-if="!activeSurveys.length" class="text-gray-600 text-sm text-center py-8 bg-[#111] rounded-xl border border-[#1a1a1a]">
            Aucun sondage actif
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="s in activeSurveys"
              :key="s.id"
              class="bg-[#111] border border-[#1a1a1a] rounded-xl p-4"
            >
              <!-- Titre + badges -->
              <div class="flex items-start gap-2 mb-3">
                <p class="flex-1 text-sm font-medium leading-snug line-clamp-2">{{ s.title }}</p>
                <span class="shrink-0 text-xs px-1.5 py-0.5 rounded bg-[#1a1a1a] text-gray-400">
                  {{ s.communes?.name ? `📍 ${s.communes.name}` : '🌍' }}
                </span>
              </div>

              <!-- Stats -->
              <div class="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span><span class="text-white font-semibold">{{ s._count ?? 0 }}</span> répondants</span>
                <span class="text-amber-400 font-medium">{{ timeLeft(s.ends_at) }}</span>
              </div>
              <div class="h-1 bg-[#1a1a1a] rounded-full overflow-hidden mb-3">
                <div
                  class="h-full bg-[#10b981] rounded-full transition-all"
                  :style="{ width: progressPct(s._count ?? 0) + '%' }"
                />
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2">
                <a
                  :href="`/sondages/${s.id}`"
                  target="_blank"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-xs text-gray-300 hover:bg-[#222] transition"
                >
                  👁️ Résultats
                </a>
                <button
                  v-if="confirmClose !== s.id"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-xs text-red-400 hover:bg-red-900/30 transition"
                  @click="confirmClose = s.id"
                >
                  🔴 Clôturer
                </button>
                <template v-else>
                  <button
                    class="px-3 py-1.5 rounded-lg bg-red-600 text-xs text-white font-semibold hover:bg-red-500 transition"
                    @click="closeSurvey(s.id)"
                  >Confirmer</button>
                  <button
                    class="px-3 py-1.5 rounded-lg bg-[#1a1a1a] text-xs text-gray-400 hover:bg-[#222] transition"
                    @click="confirmClose = null"
                  >Annuler</button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Derniers clôturés -->
        <div>
          <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Derniers clôturés</h2>
          <div v-if="!closedSurveys.length" class="text-gray-600 text-xs text-center py-4">
            Aucun sondage clôturé
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="s in closedSurveys"
              :key="s.id"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#111] border border-[#1a1a1a] hover:border-[#222] transition cursor-pointer"
              @click="openResults(s.id)"
            >
              <div class="flex-1 min-w-0">
                <p class="text-xs text-gray-300 leading-snug truncate">{{ s.title }}</p>
                <p class="text-xs text-gray-600 mt-0.5">
                  {{ s.ends_at ? new Date(s.ends_at).toLocaleDateString('fr-FR') : new Date(s.created_at).toLocaleDateString('fr-FR') }}
                </p>
              </div>
              <span class="text-xs text-gray-600 shrink-0">CLOS</span>
            </div>
          </div>
        </div>

        <!-- ── DÉMOGRAPHIE ──────────────────────────────────────────────────── -->
        <div>
          <div class="flex items-center gap-2 mb-4">
            <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-widest">Démographie</h2>
            <span v-if="demoLoading" class="text-[10px] text-gray-600 animate-pulse">Chargement…</span>
            <span v-else class="text-[10px] text-gray-600">{{ demoData.length }} réponses analysées</span>
          </div>

          <div v-if="!demoLoading && demoData.length" class="space-y-5">

            <!-- Genre -->
            <div>
              <p class="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Genre</p>
              <div class="space-y-1.5">
                <div v-for="g in genders" :key="g.val" class="flex items-center gap-2">
                  <span class="text-[11px] text-gray-400 w-20 shrink-0">{{ g.label }}</span>
                  <div class="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      class="h-full bg-[#10b981] rounded-full transition-all duration-700"
                      :style="{ width: demoPercent('gender', g.val) + '%' }"
                    />
                  </div>
                  <span class="text-[11px] text-gray-500 w-8 text-right shrink-0">{{ demoPercent('gender', g.val) }}%</span>
                </div>
              </div>
            </div>

            <!-- Âge -->
            <div>
              <p class="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Tranches d'âge</p>
              <div class="space-y-1.5">
                <div v-for="ag in ageGroups" :key="ag" class="flex items-center gap-2">
                  <span class="text-[11px] text-gray-400 w-14 shrink-0">{{ ag }}</span>
                  <div class="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      class="h-full bg-amber-400 rounded-full transition-all duration-700"
                      :style="{ width: demoPercent('age_group', ag) + '%' }"
                    />
                  </div>
                  <span class="text-[11px] text-gray-500 w-8 text-right shrink-0">{{ demoPercent('age_group', ag) }}%</span>
                </div>
              </div>
            </div>

            <!-- Top communes -->
            <div v-if="topCommunes.length">
              <p class="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Top communes</p>
              <div class="space-y-1.5">
                <div v-for="c in topCommunes" :key="c.name" class="flex items-center gap-2">
                  <span class="text-[11px] text-gray-400 w-28 shrink-0 truncate">{{ c.name }}</span>
                  <div class="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      class="h-full bg-blue-500 rounded-full transition-all duration-700"
                      :style="{ width: c.pct + '%' }"
                    />
                  </div>
                  <span class="text-[11px] text-gray-500 w-8 text-right shrink-0">{{ c.pct }}%</span>
                </div>
              </div>
            </div>

          </div>

          <div v-else-if="!demoLoading" class="text-gray-600 text-xs text-center py-6 bg-[#111] rounded-xl border border-[#1a1a1a]">
            Aucune donnée démographique
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-toast-enter-active, .slide-toast-leave-active {
  transition: all 0.3s ease;
}
.slide-toast-enter-from, .slide-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
