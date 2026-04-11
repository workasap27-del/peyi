<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Survey, AgeGroup, Gender, SurveyDemographics } from '@/types'
import { useSurveysStore } from '@/stores/surveys'
import { getOrCreateRespondentId } from '@/lib/utils'
import SurveyResultsChart from '@/components/surveys/SurveyResultsChart.vue'

const resultsRef = ref<HTMLElement | null>(null)
const sharing = ref(false)

async function shareOnWhatsApp() {
  if (!survey.value || sharing.value) return
  sharing.value = true
  try {
    const commune = survey.value.commune?.name ?? 'Guadeloupe'
    const surveyUrl = `${window.location.origin}/sondages/${props.id}`
    const text = `🗳️ Sondage Péyi — ${survey.value.title} — Voici ce que pensent les habitants de ${commune} : ${surveyUrl} Donne ton avis sur peyi.fr`

    // Capture the results block if available
    if (resultsRef.value) {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(resultsRef.value, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      })
      const dataUrl = canvas.toDataURL('image/png')
      // Trigger download
      const link = document.createElement('a')
      link.download = `peyi-${props.id}.png`
      link.href = dataUrl
      link.click()
    }

    // Open WhatsApp with pre-filled message
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  } finally {
    sharing.value = false
  }
}

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useSurveysStore()

const survey = ref<Survey | null>(null)
const loading = ref(true)

// Vue active : 'form' | 'results'
const activeTab = ref<'form' | 'results'>('form')
const submitting = ref(false)
const submitted = ref(false)

const answers = ref<Record<string, string | string[] | number>>({})
const demographics = ref<SurveyDemographics>({})

const ageGroups: AgeGroup[] = ['15-24', '25-34', '35-49', '50-64', '65+']
const genders: { value: Gender; label: string }[] = [
  { value: 'femme', label: 'Femme' },
  { value: 'homme', label: 'Homme' },
  { value: 'autre', label: 'Autre' },
  { value: 'préfère_ne_pas_répondre', label: 'Préfère ne pas répondre' },
]

const responses = computed(() => store.getResponses(props.id))
const alreadyAnswered = computed(() => store.hasAnswered(props.id))

onMounted(async () => {
  if (!store.surveys.length) await store.loadSurveys()
  survey.value = store.getSurveyById(props.id) ?? null
  loading.value = false

  // Initialiser les scales à 5
  if (survey.value) {
    for (const q of survey.value.questions) {
      if (q.type === 'scale') answers.value[q.id] = 5
    }
  }

  if (alreadyAnswered.value) activeTab.value = 'results'

  // Load real responses from Supabase (non-blocking)
  store.loadResponses(props.id)
})

function toggleMultiple(questionId: string, option: string) {
  const current = (answers.value[questionId] as string[]) ?? []
  answers.value[questionId] = current.includes(option)
    ? current.filter((v) => v !== option)
    : [...current, option]
}

function isChecked(questionId: string, option: string): boolean {
  const val = answers.value[questionId]
  return Array.isArray(val) && val.includes(option)
}

// Validation : questions required non répondues
const missingRequired = computed(() => {
  if (!survey.value) return []
  return survey.value.questions.filter((q) => {
    if (!q.required) return false
    const ans = answers.value[q.id]
    if (q.type === 'multiple') return !Array.isArray(ans) || ans.length === 0
    if (q.type === 'text') return false // jamais bloquant
    return ans === undefined || ans === '' || ans === null
  })
})

async function handleSubmit() {
  if (missingRequired.value.length > 0) return
  submitting.value = true
  try {
    await store.submitResponse({
      survey_id: props.id,
      respondent_id: getOrCreateRespondentId(),
      answers: answers.value,
      demographics: demographics.value,
    })
    submitted.value = true
    activeTab.value = 'results'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <!-- Retour -->
    <button
      class="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1"
      @click="router.back()"
    >
      ← Retour aux sondages
    </button>

    <!-- Chargement -->
    <div v-if="loading" class="space-y-4">
      <div class="h-8 bg-gray-100 rounded animate-pulse w-3/4" />
      <div class="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
      <div class="h-48 bg-gray-100 rounded-xl animate-pulse mt-4" />
    </div>

    <template v-else-if="survey">
      <!-- En-tête -->
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {{ survey.commune?.name ?? 'Toute la Guadeloupe' }}
          </span>
          <span v-if="survey.ends_at" class="text-xs text-gray-400">
            Clôture le {{ new Date(survey.ends_at).toLocaleDateString('fr-FR') }}
          </span>
        </div>
        <h1 class="text-xl font-bold leading-snug">{{ survey.title }}</h1>
        <p v-if="survey.description" class="text-sm text-gray-500 mt-1">{{ survey.description }}</p>
      </div>

      <!-- Onglets -->
      <div class="flex border-b border-gray-200 mb-6">
        <button
          class="px-4 py-2 text-sm font-medium border-b-2 transition"
          :class="activeTab === 'form'
            ? 'border-emerald-600 text-emerald-700'
            : 'border-transparent text-gray-500 hover:text-gray-700'"
          :disabled="alreadyAnswered"
          @click="activeTab = 'form'"
        >
          📝 Répondre
        </button>
        <button
          class="px-4 py-2 text-sm font-medium border-b-2 transition"
          :class="activeTab === 'results'
            ? 'border-emerald-600 text-emerald-700'
            : 'border-transparent text-gray-500 hover:text-gray-700'"
          @click="activeTab = 'results'"
        >
          📊 Résultats
          <span class="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
            {{ responses.length }}
          </span>
        </button>
      </div>

      <!-- ───── FORMULAIRE ───── -->
      <div v-if="activeTab === 'form'">

        <!-- Déjà répondu -->
        <div v-if="alreadyAnswered" class="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center mb-6">
          <div class="text-3xl mb-2">✅</div>
          <p class="font-medium text-emerald-800">Vous avez déjà participé à ce sondage.</p>
          <button class="mt-3 text-sm text-emerald-700 underline" @click="activeTab = 'results'">
            Voir les résultats →
          </button>
        </div>

        <!-- Succès soumission -->
        <div v-else-if="submitted" class="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center mb-6">
          <div class="text-4xl mb-3">🎉</div>
          <h2 class="text-lg font-bold text-emerald-800 mb-1">Merci pour votre participation !</h2>
          <p class="text-sm text-emerald-700 mb-4">Vos réponses ont été enregistrées.</p>
          <button
            class="bg-emerald-600 text-white text-sm font-medium px-5 py-2 rounded-lg"
            @click="activeTab = 'results'"
          >
            Voir les résultats →
          </button>
        </div>

        <!-- Formulaire -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-5">

          <!-- Questions -->
          <div
            v-for="question in survey.questions"
            :key="question.id"
            class="bg-white border border-gray-100 rounded-xl p-5"
            :class="{ 'border-red-300 bg-red-50': missingRequired.some(q => q.id === question.id) }"
          >
            <p class="font-medium text-sm mb-3 text-gray-800">
              {{ question.label }}
              <span v-if="question.required" class="text-red-400 ml-1 text-xs">*obligatoire</span>
            </p>

            <!-- Single choice -->
            <div v-if="question.type === 'single'" class="space-y-2">
              <label
                v-for="opt in question.options"
                :key="opt"
                class="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition"
                  :class="answers[question.id] === opt
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-gray-300 group-hover:border-emerald-300'"
                >
                  <div v-if="answers[question.id] === opt" class="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <input
                  type="radio"
                  :name="question.id"
                  :value="opt"
                  v-model="answers[question.id]"
                  class="sr-only"
                />
                <span class="text-sm text-gray-700">{{ opt }}</span>
              </label>
            </div>

            <!-- Multiple choice -->
            <div v-else-if="question.type === 'multiple'" class="space-y-2">
              <label
                v-for="opt in question.options"
                :key="opt"
                class="flex items-center gap-3 cursor-pointer group"
                @click.prevent="toggleMultiple(question.id, opt)"
              >
                <div
                  class="w-4 h-4 rounded border-2 flex items-center justify-center transition"
                  :class="isChecked(question.id, opt)
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-gray-300 group-hover:border-emerald-300'"
                >
                  <svg v-if="isChecked(question.id, opt)" class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="text-sm text-gray-700">{{ opt }}</span>
              </label>
            </div>

            <!-- Scale -->
            <div v-else-if="question.type === 'scale'" class="space-y-3">
              <div class="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  v-model="answers[question.id]"
                  class="flex-1 accent-emerald-600"
                />
                <span
                  class="text-2xl font-bold text-emerald-700 w-8 text-center"
                >{{ answers[question.id] ?? 5 }}</span>
              </div>
              <div class="flex justify-between text-xs text-gray-400">
                <span>1 — Très insatisfait</span>
                <span>10 — Très satisfait</span>
              </div>
            </div>

            <!-- Text -->
            <textarea
              v-else-if="question.type === 'text'"
              v-model="answers[question.id] as string"
              rows="3"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
              placeholder="Votre réponse (facultatif)..."
            />
          </div>

          <!-- Démographie -->
          <div class="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h3 class="font-semibold text-sm mb-1 text-blue-800">Données démographiques</h3>
            <p class="text-xs text-blue-600 mb-4">Facultatif — permet d'affiner les résultats par profil.</p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-600 font-medium block mb-1">Tranche d'âge</label>
                <select
                  v-model="demographics.age_group"
                  class="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                >
                  <option value="">Non précisé</option>
                  <option v-for="ag in ageGroups" :key="ag" :value="ag">{{ ag }} ans</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-gray-600 font-medium block mb-1">Genre</label>
                <select
                  v-model="demographics.gender"
                  class="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white"
                >
                  <option value="">Non précisé</option>
                  <option v-for="g in genders" :key="g.value" :value="g.value">{{ g.label }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Erreurs validation -->
          <div v-if="missingRequired.length > 0" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            Veuillez répondre aux questions obligatoires avant de soumettre.
          </div>

          <button
            type="submit"
            :disabled="submitting || missingRequired.length > 0"
            class="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {{ submitting ? 'Envoi en cours…' : 'Soumettre mes réponses' }}
          </button>
        </form>
      </div>

      <!-- ───── RÉSULTATS ───── -->
      <div v-else-if="activeTab === 'results'">
        <div ref="resultsRef">
          <SurveyResultsChart :survey="survey" :responses="responses" />
        </div>

        <!-- Partage WhatsApp -->
        <div class="mt-6 pt-6 border-t border-gray-100">
          <button
            class="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-white transition active:scale-[0.98]"
            style="background-color: #25D366"
            :disabled="sharing"
            @click="shareOnWhatsApp"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.859L.057 23.293a.75.75 0 0 0 .908.921l5.594-1.46A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.502-5.241-1.38l-.364-.21-3.774.985.997-3.649-.228-.373A9.942 9.942 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
            <span>{{ sharing ? 'Préparation…' : 'Partager sur WhatsApp' }}</span>
          </button>
          <p class="text-xs text-gray-400 text-center mt-2">
            Télécharge aussi la capture des résultats pour l'envoyer directement
          </p>
        </div>
      </div>
    </template>

    <div v-else class="text-center py-16 text-gray-500">
      Sondage introuvable.
    </div>
  </div>
</template>
