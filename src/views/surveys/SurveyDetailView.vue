<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Survey } from '@/types'
import { useSurveysStore } from '@/stores/surveys'
import { NOM_TO_CODE, COMMUNE_POPULATION } from '@/data/communeStats'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useSurveysStore()

const survey = ref<Survey | null>(null)
const loading = ref(true)
const toastMsg = ref<string | null>(null)

onMounted(async () => {
  if (!store.surveys.length) await store.loadSurveys()
  survey.value = store.getSurveyById(props.id) ?? null
  if (survey.value) {
    await store.loadResponses(props.id)
  } else {
    toastMsg.value = 'Sondage introuvable ou supprimé.'
    setTimeout(() => router.replace('/sondages'), 2500)
  }
  loading.value = false
})

const responses = computed(() => store.getResponses(props.id))
const n = computed(() => responses.value.length)

const reliabilityBadge = computed((): { label: string; cls: string } => {
  if (n.value >= 500) return { label: 'Représentatif ★',       cls: 'bg-emerald-100 text-emerald-700' }
  if (n.value >= 200) return { label: 'Résultats fiables ✓',  cls: 'bg-blue-100 text-blue-700' }
  if (n.value >= 50)  return { label: 'Tendance en cours 📊', cls: 'bg-amber-100 text-amber-700' }
  return                      { label: 'Début de l\'enquête 🌱', cls: 'bg-gray-100 text-gray-600' }
})

const q1Options = computed(() => {
  const opts = (survey.value?.questions?.[0]?.options as string[]) ?? []
  const counts: Record<string, number> = {}
  opts.forEach(o => { counts[o] = 0 })
  for (const r of responses.value) {
    const ans = (r.answers as Record<string, string>)?.q1
    if (ans && ans in counts) counts[ans]++
  }
  return opts.map(o => ({
    label: o,
    count: counts[o],
    pct: n.value > 0 ? Math.round(counts[o] / n.value * 100) : 0,
  }))
})

const topAnswer = computed(() => {
  if (!q1Options.value.length || n.value === 0) return null
  return q1Options.value.reduce((a, b) => b.pct > a.pct ? b : a)
})

const periodLabel = computed(() => {
  if (!survey.value) return ''
  const from = new Date(survey.value.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const to = survey.value.ends_at
    ? new Date(survey.value.ends_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'en cours'
  return `Du ${from} au ${to}`
})

const demoBreakdown = computed(() => {
  const genre: Record<string, number> = {}
  const age: Record<string, number> = {}
  const commune: Record<string, number> = {}
  for (const r of responses.value) {
    const d = r.demographics as Record<string, string> | null
    if (d?.gender)    genre[d.gender]     = (genre[d.gender] ?? 0) + 1
    if (d?.age_group) age[d.age_group]    = (age[d.age_group] ?? 0) + 1
    if (d?.commune)   commune[d.commune]  = (commune[d.commune] ?? 0) + 1
  }
  return { genre, age, commune }
})

const dominantGender = computed(() => {
  const entries = Object.entries(demoBreakdown.value.genre)
  if (!entries.length) return '—'
  const [val] = entries.reduce((a, b) => b[1] > a[1] ? b : a)
  const labels: Record<string, string> = { homme: 'Homme', femme: 'Femme', autre: 'Autre' }
  return labels[val] ?? val
})

const dominantAge = computed(() => {
  const entries = Object.entries(demoBreakdown.value.age)
  if (!entries.length) return '—'
  return entries.reduce((a, b) => b[1] > a[1] ? b : a)[0]
})

const topCommuneLabel = computed(() => {
  const entries = Object.entries(demoBreakdown.value.commune)
  if (!entries.length) return '—'
  return entries.reduce((a, b) => b[1] > a[1] ? b : a)[0]
})

const communeParticipation = computed(() => {
  const entries = Object.entries(demoBreakdown.value.commune)
    .sort((a, b) => b[1] - a[1])
  return entries.map(([name, count]) => {
    const code = NOM_TO_CODE[name]
    const pop = code ? COMMUNE_POPULATION[code] : undefined
    const popPct = pop ? (count / pop * 100) : null
    return { name, count, popPct }
  })
})

const answered = computed(() => store.hasAnswered(props.id))

function goParticipate() {
  router.push(`/participer/${props.id}`)
}
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center min-h-screen pb-24 bg-gray-50">
    <div class="text-gray-400 text-sm">Chargement…</div>
  </div>

  <div v-else-if="!survey" class="flex items-center justify-center min-h-screen pb-24 bg-gray-50">
    <div class="text-center px-6">
      <div class="text-4xl mb-4">🔍</div>
      <p class="text-gray-700 font-semibold mb-1">Sondage introuvable</p>
      <p class="text-gray-400 text-sm mb-4">{{ toastMsg }}</p>
    </div>
  </div>

  <div v-else class="min-h-screen bg-gray-50 pb-28">

    <!-- ── Section 1 : Header ─────────────────────────────────────────────── -->
    <div class="bg-white px-4 pt-6 pb-4">
      <button
        class="text-gray-500 text-sm flex items-center gap-1 mb-3 hover:text-gray-800 transition"
        @click="router.back()"
      >← Retour</button>

      <div class="flex items-start justify-between gap-3">
        <h1 class="text-gray-900 font-bold text-xl leading-snug flex-1">{{ survey.title }}</h1>
        <span
          class="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold"
          :class="reliabilityBadge.cls"
        >{{ reliabilityBadge.label }}</span>
      </div>
      <p class="text-gray-400 text-sm mt-1">{{ periodLabel }}</p>
    </div>

    <!-- ── Section 2 : Résultat dominant ─────────────────────────────────── -->
    <div class="bg-gray-950 rounded-2xl mx-4 mt-4 p-6">
      <div v-if="n === 0" class="text-center py-4">
        <p class="text-gray-500 text-sm animate-pulse">Aucune réponse pour l'instant</p>
      </div>
      <div v-else class="text-center">
        <p class="text-emerald-400 font-bold text-5xl leading-none mb-2">{{ topAnswer?.pct }}%</p>
        <p class="text-white font-black text-3xl leading-snug mb-1">{{ topAnswer?.label }}</p>
        <p class="text-white/50 text-sm mb-4">des répondants</p>
        <p class="text-white/40 text-xs">sur {{ n }} personne{{ n > 1 ? 's' : '' }} interrogée{{ n > 1 ? 's' : '' }}</p>
      </div>
    </div>

    <!-- ── Section 3 : Détail des réponses ───────────────────────────────── -->
    <div class="bg-white px-4 mt-4 pt-4 pb-2">
      <p class="text-gray-400 text-xs uppercase tracking-wider mb-3">Répartition des réponses</p>
      <div
        v-for="opt in q1Options"
        :key="opt.label"
        class="mb-4"
      >
        <div class="flex justify-between items-center mb-1">
          <span class="text-gray-900 text-sm font-medium">{{ opt.label }}</span>
          <span class="text-gray-900 text-sm font-bold">{{ opt.pct }}%</span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-700"
            :class="opt === topAnswer ? 'bg-emerald-600' : 'bg-gray-300'"
            :style="{ width: opt.pct + '%' }"
          />
        </div>
      </div>
    </div>

    <!-- ── Section 4 : Participation par commune ─────────────────────────── -->
    <div class="bg-gray-50 rounded-2xl mx-4 mt-4 p-5">
      <p class="text-gray-400 text-xs uppercase tracking-wider mb-3">Participation par commune</p>
      <div v-if="communeParticipation.length">
        <div
          v-for="c in communeParticipation"
          :key="c.name"
          class="mb-2"
        >
          <div class="flex justify-between items-center mb-0.5">
            <span class="text-gray-700 text-sm">{{ c.name }}</span>
            <span class="text-gray-500 text-xs">
              {{ c.count }} rép.
              <span v-if="c.popPct !== null">({{ c.popPct < 0.01 ? '< 0.01' : c.popPct.toFixed(2) }}%)</span>
            </span>
          </div>
          <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-emerald-500 rounded-full transition-all duration-700"
              :style="{ width: (c.popPct !== null ? Math.min(100, c.popPct * 20) : Math.min(100, c.count / Math.max(...communeParticipation.map(x => x.count)) * 100)) + '%' }"
            />
          </div>
        </div>
      </div>
      <p v-else class="text-gray-400 text-sm italic">Données géographiques non disponibles</p>
    </div>

    <!-- ── Section 5 : Profil des répondants ─────────────────────────────── -->
    <div class="bg-white border border-gray-100 rounded-2xl mx-4 mt-4 p-5">
      <p class="text-gray-400 text-xs uppercase tracking-wider mb-3">Profil des répondants</p>
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center">
          <p class="text-gray-900 font-bold text-base">{{ dominantGender }}</p>
          <p class="text-gray-400 text-xs mt-0.5">Genre</p>
        </div>
        <div class="text-center">
          <p class="text-gray-900 font-bold text-base">{{ dominantAge }}</p>
          <p class="text-gray-400 text-xs mt-0.5">Tranche d'âge</p>
        </div>
        <div class="text-center">
          <p class="text-gray-900 font-bold text-sm truncate">{{ topCommuneLabel }}</p>
          <p class="text-gray-400 text-xs mt-0.5">Top commune</p>
        </div>
      </div>
    </div>

    <!-- ── Section 6 : CTA participation ─────────────────────────────────── -->
    <div
      v-if="!answered && survey.is_active !== false"
      class="bg-emerald-50 border border-emerald-200 rounded-2xl mx-4 mt-2 mb-6 p-5 text-center"
    >
      <p class="text-emerald-800 text-sm mb-3">Tu n'as pas encore répondu à ce sondage.</p>
      <button
        class="bg-emerald-600 text-white rounded-full py-3 px-6 font-medium text-sm hover:bg-emerald-700 transition"
        @click="goParticipate"
      >Participer maintenant →</button>
      <p class="text-gray-400 text-xs italic mt-3">Export PDF disponible avec un abonnement professionnel</p>
    </div>

  </div>
</template>
