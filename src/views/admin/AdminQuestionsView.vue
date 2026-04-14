<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// ── Auth ──────────────────────────────────────────────────────────────────────
const tokenFromUrl = ref((route.query.token as string) ?? '')
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
      'Authorization': `Bearer ${tokenFromUrl.value}`,
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
    // On teste le token en appelant list-surveys
    const res = await fetch('/api/admin/list-surveys', {
      headers: { Authorization: `Bearer ${tok}` },
    })
    if (res.ok) {
      tokenFromUrl.value = tok
      isAuthenticated.value = true
    } else {
      authError.value = 'Token invalide'
    }
  } catch {
    authError.value = 'Erreur réseau'
  } finally {
    authLoading.value = false
  }
}

// ── Communes ──────────────────────────────────────────────────────────────────
const COMMUNES = [
  'Basse-Terre', 'Baillif', 'Bouillante', 'Capesterre-Belle-Eau', 'Gourbeyre',
  'Pointe-Noire', 'Saint-Claude', 'Trois-Rivières', 'Vieux-Fort', 'Vieux-Habitants',
  'Pointe-à-Pitre', 'Les Abymes', 'Baie-Mahault', 'Le Gosier', "Morne-à-l'Eau",
  'Petit-Bourg', 'Sainte-Anne', 'Sainte-Rose', 'Saint-François',
  'Anse-Bertrand', 'La Désirade', 'Le Lamentin', 'Le Moule', 'Port-Louis',
  'Saint-Louis (Marie-Galante)', 'Capesterre-de-Marie-Galante', 'Grand-Bourg',
  'Saint-Barthélemy', 'Saint-Martin',
  'Terre-de-Bas', 'Terre-de-Haut', 'Vieux-Fort (Les Saintes)'
]

// ── Formulaire ────────────────────────────────────────────────────────────────
const title = ref('')
const scope = ref<'global' | 'commune' | 'quarterly'>('global')
const communeSearch = ref('')
const selectedCommune = ref('')
const answerType = ref<'yesno' | 'scale5' | 'multiple' | 'scale10'>('yesno')
const customOptions = ref<string[]>(['', ''])
const duration = ref<'48h' | '7d' | '30d' | 'custom'>('48h')
const customDate = ref('')
const context = ref('')
const publishing = ref(false)
const toast = ref<{ msg: string; type: 'success' | 'error' } | null>(null)

const filteredCommunes = computed(() =>
  COMMUNES.filter(c => c.toLowerCase().includes(communeSearch.value.toLowerCase()))
)

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
        commune_name: scope.value === 'commune' ? selectedCommune.value || null : null,
        questions: buildQuestions(),
        is_active: true,
        ends_at: endsAt.value?.toISOString() ?? null,
      }),
    })

    showToast('Sondage publié ✓', 'success')
    title.value = ''
    context.value = ''
    communeSearch.value = ''
    selectedCommune.value = ''
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

function openResults(id: string) {
  window.open(`/sondages/${id}`, '_blank')
}

// ── Montage ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (tokenFromUrl.value) {
    await authenticate(tokenFromUrl.value)
  }
})

watch(isAuthenticated, async (v) => {
  if (v) await loadSurveys()
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
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="opt in [
                { value: 'global', icon: '🌍', label: 'Toute la Guadeloupe' },
                { value: 'commune', icon: '📍', label: 'Commune spécifique' },
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

        <!-- Champ 3 : Commune (si scope commune) -->
        <div v-if="scope === 'commune'">
          <label class="text-xs text-gray-400 mb-2 block">Commune</label>
          <input
            v-model="communeSearch"
            type="text"
            placeholder="Rechercher une commune..."
            class="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:border-[#10b981] outline-none transition mb-2"
          />
          <div class="max-h-40 overflow-y-auto rounded-xl border border-[#222] bg-[#111]">
            <button
              v-for="c in filteredCommunes"
              :key="c"
              class="w-full text-left px-4 py-2 text-sm transition"
              :class="selectedCommune === c
                ? 'bg-[#10b981]/20 text-[#10b981]'
                : 'text-gray-300 hover:bg-[#1a1a1a]'"
              @click="selectedCommune = c; communeSearch = c"
            >
              {{ c }}
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
