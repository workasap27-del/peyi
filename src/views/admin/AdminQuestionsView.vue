<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const token = computed(() => (route.query.token as string) ?? '')
const adminBase = computed(() => `/api/admin`)

// État
const proposals = ref<any[]>([])
const history = ref<any[]>([])
const loading = ref(false)
const emergencyText = ref('')
const emergencySlot = ref('actualite')
const feedback = ref('')

async function apiFetch(path: string, opts: RequestInit = {}) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${path}${sep}token=${token.value}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function loadProposals() {
  loading.value = true
  try {
    proposals.value = await apiFetch(`${adminBase.value}/proposals`)
  } catch (e: any) {
    feedback.value = `Erreur : ${e.message}`
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
    const { data } = await sb.from('surveys')
      .select('id, title, created_at, is_active')
      .order('created_at', { ascending: false })
      .limit(10)
    history.value = data ?? []
  } catch { history.value = [] }
}

async function validate(id: string) {
  try {
    await apiFetch(`${adminBase.value}/validate`, {
      method: 'POST',
      body: JSON.stringify({ proposal_id: id }),
    })
    feedback.value = '✅ Proposition validée — elle sera publiée à 12h.'
    await loadProposals()
  } catch (e: any) {
    feedback.value = `❌ ${e.message}`
  }
}

async function regenerate() {
  feedback.value = 'Régénération en cours…'
  try {
    const result = await apiFetch(`/api/cron/generate`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    feedback.value = `✅ ${result.inserted} nouvelles propositions générées.`
    await loadProposals()
  } catch (e: any) {
    feedback.value = `❌ ${e.message}`
  }
}

async function publishEmergency() {
  if (!emergencyText.value.trim()) return
  try {
    const result = await apiFetch(`${adminBase.value}/emergency`, {
      method: 'POST',
      body: JSON.stringify({ question_text: emergencyText.value, slot_type: emergencySlot.value }),
    })
    feedback.value = `✅ Question publiée : ${result.id}`
    emergencyText.value = ''
    await loadHistory()
  } catch (e: any) {
    feedback.value = `❌ ${e.message}`
  }
}

onMounted(async () => {
  if (!token.value) {
    feedback.value = '⚠️ Token admin manquant. Ajoutez ?token=VOTRE_TOKEN à l\'URL.'
    return
  }
  await Promise.all([loadProposals(), loadHistory()])
})
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white p-4">
    <div class="max-w-6xl mx-auto">

      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <span class="text-2xl">🗳️</span>
        <h1 class="text-xl font-bold">Péyi Admin — Questions du jour</h1>
        <span class="ml-auto text-xs text-gray-500">{{ new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) }}</span>
      </div>

      <!-- Feedback -->
      <div v-if="feedback" class="mb-4 p-3 rounded-lg text-sm" :class="feedback.startsWith('✅') ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'">
        {{ feedback }}
        <button class="ml-3 text-xs opacity-50 hover:opacity-100" @click="feedback = ''">✕</button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- Colonne 1 : Propositions du jour -->
        <div class="lg:col-span-1 space-y-3">
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Propositions IA du jour</h2>

          <div v-if="loading" class="text-gray-500 text-sm">Chargement…</div>

          <div v-else-if="!proposals.length" class="bg-gray-900 rounded-xl p-4 text-gray-500 text-sm">
            Aucune proposition générée aujourd'hui. Cliquez sur "Régénérer tout".
          </div>

          <div
            v-for="p in proposals"
            :key="p.id"
            class="bg-gray-900 rounded-xl p-4 border transition"
            :class="{
              'border-emerald-600': p.status === 'validated',
              'border-red-900': p.status === 'rejected',
              'border-gray-800': p.status === 'pending'
            }"
          >
            <p class="font-medium text-sm mb-2 leading-snug">{{ p.question_text }}</p>
            <p class="text-xs text-gray-400 mb-1"><span class="text-gray-500">Pourquoi :</span> {{ p.why }}</p>
            <p class="text-xs text-gray-400 mb-3"><span class="text-gray-500">Split attendu :</span> {{ p.expected_split }}</p>

            <div class="flex gap-2 items-center">
              <span v-if="p.status === 'validated'" class="text-xs text-emerald-400 font-semibold">✅ Validée</span>
              <span v-else-if="p.status === 'rejected'" class="text-xs text-red-400">✕ Rejetée</span>
              <button
                v-else
                class="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-xs font-semibold transition"
                @click="validate(p.id)"
              >
                Valider
              </button>
              <details class="ml-auto">
                <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-300">Contexte</summary>
                <p class="text-xs text-gray-600 mt-1 max-h-20 overflow-y-auto">{{ p.context || 'Pas de contexte' }}</p>
              </details>
            </div>
          </div>
        </div>

        <!-- Colonne 2 : Actions globales -->
        <div class="space-y-4">
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Actions globales</h2>

          <button
            class="w-full bg-blue-800 hover:bg-blue-700 rounded-xl px-4 py-3 text-sm font-semibold transition"
            @click="regenerate"
          >
            🔄 Régénérer tout
          </button>

          <div class="bg-gray-900 rounded-xl p-4 space-y-3">
            <p class="text-sm font-medium text-amber-400">⚡ Mode urgence</p>
            <textarea
              v-model="emergencyText"
              placeholder="Saisir une question directement…"
              class="w-full bg-gray-800 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none border border-gray-700 focus:border-amber-500 outline-none"
              rows="3"
            />
            <select
              v-model="emergencySlot"
              class="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm border border-gray-700 outline-none"
            >
              <option value="fond_permanent">fond_permanent</option>
              <option value="actualite">actualite</option>
              <option value="thematique">thematique</option>
              <option value="tension_sociale">tension_sociale</option>
              <option value="prospective">prospective</option>
              <option value="culture">culture</option>
              <option value="bilan">bilan</option>
            </select>
            <button
              class="w-full bg-amber-700 hover:bg-amber-600 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-40"
              :disabled="!emergencyText.trim()"
              @click="publishEmergency"
            >
              Publier immédiatement
            </button>
          </div>
        </div>

        <!-- Colonne 3 : Historique -->
        <div class="space-y-3">
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">10 dernières questions</h2>

          <div
            v-for="s in history"
            :key="s.id"
            class="bg-gray-900 rounded-xl p-3 border border-gray-800 flex items-start gap-3"
          >
            <div class="flex-1">
              <p class="text-xs font-medium leading-snug">{{ s.title }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ new Date(s.created_at).toLocaleDateString('fr-FR') }}</p>
            </div>
            <span
              class="text-xs px-2 py-0.5 rounded-full shrink-0"
              :class="s.is_active ? 'bg-emerald-900 text-emerald-400' : 'bg-gray-800 text-gray-500'"
            >
              {{ s.is_active ? 'EN COURS' : 'CLOS' }}
            </span>
          </div>

          <p v-if="!history.length" class="text-gray-500 text-sm">Aucune question.</p>
        </div>

      </div>
    </div>
  </div>
</template>
