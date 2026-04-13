<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Survey } from '@/types'
import { useSurveysStore } from '@/stores/surveys'
import { getOrCreateRespondentId } from '@/lib/utils'
import { useReportGenerator } from '@/composables/useReportGenerator'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useSurveysStore()
const { generateReport, generating } = useReportGenerator()

const survey = ref<Survey | null>(null)
const loading = ref(true)
const resultsRef = ref<HTMLElement | null>(null)

// ── Chargement ────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!store.surveys.length) await store.loadSurveys()
  survey.value = store.getSurveyById(props.id) ?? null
  if (survey.value) await store.loadResponses(props.id)
  loading.value = false
})

// ── Réponses et calculs ───────────────────────────────────────────────────────
const responses = computed(() => store.getResponses(props.id))
const n = computed(() => responses.value.length)

/** Marge d'erreur standard : 1/√n × 100, arrondie à 1 décimale */
const marginError = computed(() => {
  if (n.value < 2) return null
  return Math.round((1 / Math.sqrt(n.value)) * 100 * 10) / 10
})

/** Score fiabilité : A (n>500), B (n>200), C (n>50), D (n<50) */
const reliabilityScore = computed(() => {
  if (n.value >= 500) return 'A'
  if (n.value >= 200) return 'B'
  if (n.value >= 50)  return 'C'
  return 'D'
})

const reliabilityColor = computed(() => ({
  A: 'bg-emerald-100 text-emerald-800',
  B: 'bg-amber-100 text-amber-800',
  C: 'bg-red-100 text-red-800',
  D: 'bg-gray-100 text-gray-600',
}[reliabilityScore.value]))

/** Calcul résultats par option pour la première question */
const q1Options = computed(() => {
  const opts = survey.value?.questions?.[0]?.options as string[] ?? []
  const counts: Record<string, number> = {}
  opts.forEach(o => counts[o] = 0)
  for (const r of responses.value) {
    const ans = (r.answers as Record<string, string>)?.q1
    if (ans && ans in counts) counts[ans]++
  }
  return opts.map(o => ({ label: o, count: counts[o], pct: n.value > 0 ? Math.round(counts[o] / n.value * 100) : 0 }))
})

/** Ventilation démographique */
const demoBreakdown = computed(() => {
  const genre: Record<string, number> = {}
  const age: Record<string, number> = {}
  const commune: Record<string, number> = {}
  for (const r of responses.value) {
    const d = r.demographics as Record<string, string> | null
    if (d?.gender) genre[d.gender] = (genre[d.gender] ?? 0) + 1
    if (d?.age_group) age[d.age_group] = (age[d.age_group] ?? 0) + 1
    if (d?.commune) commune[d.commune] = (commune[d.commune] ?? 0) + 1
  }
  return { genre, age, commune }
})

/** Détection biais automatique */
const biasFlags = computed(() => {
  const flags: string[] = []
  if (n.value < 50) flags.push('Résultats indicatifs uniquement (n < 50)')
  if (n.value > 0) {
    for (const [c, cnt] of Object.entries(demoBreakdown.value.commune)) {
      if ((cnt as number) / n.value > 0.4) flags.push(`Biais géographique : ${c} surreprésentée (${Math.round((cnt as number)/n.value*100)}%)`)
    }
    for (const [a, cnt] of Object.entries(demoBreakdown.value.age)) {
      if ((cnt as number) / n.value > 0.5) flags.push(`Biais démographique : tranche ${a} surreprésentée (${Math.round((cnt as number)/n.value*100)}%)`)
    }
  }
  return flags
})

// ── Charts avec Chart.js ──────────────────────────────────────────────────────
const donutRef = ref<HTMLCanvasElement | null>(null)
const barAgeRef = ref<HTMLCanvasElement | null>(null)
const barGenreRef = ref<HTMLCanvasElement | null>(null)
const barCommuneRef = ref<HTMLCanvasElement | null>(null)

let donutChart: any = null
let barAgeChart: any = null
let barGenreChart: any = null
let barCommuneChart: any = null

const COLORS = ['#10b981', '#6ee7b7', '#f59e0b', '#f87171']

async function buildCharts() {
  const { Chart, registerables } = await import('chart.js')
  Chart.register(...registerables)

  // Donut — résultats globaux
  if (donutRef.value) {
    donutChart?.destroy()
    donutChart = new Chart(donutRef.value, {
      type: 'doughnut',
      data: {
        labels: q1Options.value.map(o => o.label),
        datasets: [{ data: q1Options.value.map(o => o.count || 1), backgroundColor: COLORS, borderWidth: 0 }],
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, color: '#6b7280' } } } },
    })
  }

  // Barres genre
  if (barGenreRef.value && Object.keys(demoBreakdown.value.genre).length) {
    barGenreChart?.destroy()
    const labels = Object.keys(demoBreakdown.value.genre)
    barGenreChart = new Chart(barGenreRef.value, {
      type: 'bar',
      data: { labels, datasets: [{ data: labels.map(l => demoBreakdown.value.genre[l]), backgroundColor: '#818cf8', borderRadius: 4 }] },
      options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } },
    })
  }

  // Barres âge
  if (barAgeRef.value && Object.keys(demoBreakdown.value.age).length) {
    barAgeChart?.destroy()
    const labels = Object.keys(demoBreakdown.value.age)
    barAgeChart = new Chart(barAgeRef.value, {
      type: 'bar',
      data: { labels, datasets: [{ data: labels.map(l => demoBreakdown.value.age[l]), backgroundColor: '#34d399', borderRadius: 4 }] },
      options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } },
    })
  }

  // Barres communes top 8
  if (barCommuneRef.value && Object.keys(demoBreakdown.value.commune).length) {
    barCommuneChart?.destroy()
    const sorted = Object.entries(demoBreakdown.value.commune).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8)
    barCommuneChart = new Chart(barCommuneRef.value, {
      type: 'bar',
      data: { labels: sorted.map(e => e[0]), datasets: [{ data: sorted.map(e => e[1]), backgroundColor: '#fb923c', borderRadius: 4 }] },
      options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } },
    })
  }
}

watch([survey, responses], async () => {
  if (survey.value) await buildCharts()
}, { immediate: false })

onMounted(async () => {
  // Attendre que les données soient chargées puis construire les charts
  const unwatch = watch(loading, async (v) => {
    if (!v && survey.value) {
      await buildCharts()
      unwatch()
    }
  })
})

onUnmounted(() => {
  donutChart?.destroy()
  barAgeChart?.destroy()
  barGenreChart?.destroy()
  barCommuneChart?.destroy()
})

// ── Dates ─────────────────────────────────────────────────────────────────────
const periodLabel = computed(() => {
  if (!survey.value) return ''
  const from = new Date(survey.value.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  const to = survey.value.ends_at
    ? new Date(survey.value.ends_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'en cours'
  return `${from} → ${to}`
})

const answered = computed(() => store.hasAnswered(props.id))

function goParticipate() {
  router.push(`/participer/${props.id}`)
}

function downloadPdf() {
  generateReport(props.id, survey.value!, responses.value, q1Options.value, demoBreakdown.value, biasFlags.value)
}
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center h-screen bg-gray-50">
    <div class="text-gray-400 text-sm">Chargement…</div>
  </div>

  <div v-else-if="!survey" class="flex items-center justify-center h-screen bg-gray-50">
    <p class="text-gray-400">Sondage introuvable.</p>
  </div>

  <div v-else class="min-h-screen bg-gray-50">

    <!-- Bouton retour -->
    <div class="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
      <button class="text-gray-500 hover:text-gray-800 transition flex items-center gap-1 text-sm" @click="router.back()">
        ← Retour
      </button>
      <span class="text-gray-300">|</span>
      <span class="text-sm font-medium text-gray-700 truncate">Résultats</span>
    </div>

    <div ref="resultsRef" class="max-w-2xl mx-auto px-4 pb-24 pt-6 space-y-6">

      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h1 class="text-lg font-bold text-gray-900 leading-snug mb-3">{{ survey.title }}</h1>

        <div class="flex flex-wrap gap-2 items-center text-sm">
          <span class="text-gray-500">{{ periodLabel }}</span>
          <span class="text-gray-300">·</span>
          <span class="font-semibold text-gray-800">{{ n }} répondant{{ n !== 1 ? 's' : '' }}</span>
          <span v-if="marginError" class="text-gray-500">± {{ marginError }}%</span>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-bold"
            :class="reliabilityColor"
          >Score {{ reliabilityScore }}</span>
        </div>

        <p class="text-xs text-gray-400 mt-2">
          Score A = n>500 profil équilibré · B = n>200 · C = n>50 · D = indicatif uniquement
        </p>
      </div>

      <!-- ── Résultats globaux (donut + barres) ─────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <!-- Donut -->
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Résultat global</p>
          <div v-if="n === 0" class="text-center text-gray-400 text-sm py-8">Aucune réponse</div>
          <canvas v-else ref="donutRef" />
        </div>

        <!-- Barres résultats -->
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Détail</p>
          <div v-for="opt in q1Options" :key="opt.label" class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-gray-700 truncate max-w-[75%]">{{ opt.label }}</span>
              <span class="font-semibold text-gray-900">{{ opt.pct }}%</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full transition-all duration-700" :style="{ width: opt.pct + '%' }" />
            </div>
          </div>
        </div>
      </div>

      <!-- ── Ventilation démographique ──────────────────────────────────── -->
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Ventilation démographique</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p class="text-xs text-gray-500 mb-2 font-medium">Genre</p>
            <div v-if="Object.keys(demoBreakdown.genre).length === 0" class="text-xs text-gray-400">Non renseigné</div>
            <canvas v-else ref="barGenreRef" />
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-2 font-medium">Âge</p>
            <div v-if="Object.keys(demoBreakdown.age).length === 0" class="text-xs text-gray-400">Non renseigné</div>
            <canvas v-else ref="barAgeRef" />
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-2 font-medium">Top communes</p>
            <div v-if="Object.keys(demoBreakdown.commune).length === 0" class="text-xs text-gray-400">Non renseigné</div>
            <canvas v-else ref="barCommuneRef" />
          </div>
        </div>
      </div>

      <!-- ── Heatmap communes ────────────────────────────────────────────── -->
      <div v-if="Object.keys(demoBreakdown.commune).length > 0" class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Participation par commune</p>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="[commune, cnt] in Object.entries(demoBreakdown.commune).sort((a,b) => (b[1] as number)-(a[1] as number))"
            :key="commune"
            class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
            :style="{
              background: `rgba(16,185,129,${Math.min(0.9, (cnt as number) / Math.max(...Object.values(demoBreakdown.commune).map(Number)) * 0.9 + 0.1)})`,
              color: (cnt as number) / Math.max(...Object.values(demoBreakdown.commune).map(Number)) > 0.5 ? 'white' : '#065f46'
            }"
          >
            {{ commune }} <span class="opacity-75">({{ cnt }})</span>
          </div>
        </div>
      </div>

      <!-- ── Points de vigilance ────────────────────────────────────────── -->
      <div v-if="biasFlags.length" class="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-amber-500 text-lg">⚠️</span>
          <p class="text-sm font-semibold text-amber-800">Points de vigilance méthodologiques</p>
        </div>
        <ul class="space-y-1">
          <li v-for="flag in biasFlags" :key="flag" class="text-xs text-amber-700 flex items-start gap-2">
            <span class="mt-0.5 shrink-0">•</span>{{ flag }}
          </li>
        </ul>
      </div>

      <!-- ── Bouton participer ───────────────────────────────────────────── -->
      <div v-if="!answered && survey.is_active !== false" class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
        <p class="text-sm text-emerald-800 font-medium mb-3">Tu n'as pas encore répondu à ce sondage.</p>
        <button
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-semibold text-sm transition"
          @click="goParticipate"
        >
          Participer maintenant →
        </button>
      </div>

      <!-- ── Bouton PDF ─────────────────────────────────────────────────── -->
      <button
        class="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl font-semibold text-sm transition disabled:opacity-50"
        :disabled="generating"
        @click="downloadPdf"
      >
        <span v-if="generating">Génération en cours…</span>
        <span v-else>📄 Télécharger le rapport PDF</span>
      </button>

    </div>
  </div>
</template>
