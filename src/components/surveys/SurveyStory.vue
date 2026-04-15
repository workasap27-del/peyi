<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Survey, SurveyQuestion, AgeGroup, Gender, EmploymentStatus, SurveyDemographics } from '@/types'
import { useSurveysStore } from '@/stores/surveys'
import { useCommunesStore } from '@/stores/communes'
import { getOrCreateRespondentId } from '@/lib/utils'

const props = defineProps<{ survey: Survey }>()
const router = useRouter()
const store = useSurveysStore()
const communesStore = useCommunesStore()

// ── Communes Guadeloupe (34) ─────────────────────────────────────────────────
const COMMUNES: string[] = [
  'Les Abymes', 'Anse-Bertrand', 'Baie-Mahault', 'Baillif', 'Basse-Terre',
  'Bouillante', 'Capesterre-Belle-Eau', 'Capesterre-de-Marie-Galante',
  'Deshaies', 'Gourbeyre', 'Goyave', 'Grand-Bourg', 'La Désirade',
  'Le Gosier', 'Le Lamentin', 'Le Moule', "Morne-à-l'Eau", 'Petit-Bourg',
  'Petit-Canal', 'Pointe-à-Pitre', 'Pointe-Noire', 'Port-Louis',
  'Saint-Barthélemy', 'Saint-Claude', 'Saint-François',
  'Saint-Louis (Marie-Galante)', 'Saint-Martin', 'Sainte-Anne', 'Sainte-Rose',
  'Terre-de-Bas', 'Terre-de-Haut', 'Trois-Rivières', 'Vieux-Fort', 'Vieux-Habitants',
]

// ── État questionnaire ────────────────────────────────────────────────────────
const currentIndex = ref(0)
const answers = ref<Record<string, string | string[] | number>>({})
const direction = ref<'forward' | 'back'>('forward')
const submitting = ref(false)
const phase = ref<'questions' | 'demo' | 'done'>('questions')

// ── Profil citoyen persistant ─────────────────────────────────────────────────
interface CitizenProfile {
  age_group?: AgeGroup
  gender?: Gender
  commune?: string
  employment_status?: EmploymentStatus
  sector?: string
}

const profile = ref<CitizenProfile>({})
const hasExistingProfile = ref(false)
const communeQuery = ref('')
const communeDropdownOpen = ref(false)

const filteredCommunes = computed(() => {
  const q = communeQuery.value.toLowerCase().trim()
  if (!q) return COMMUNES
  return COMMUNES.filter(c => c.toLowerCase().includes(q))
})

function selectCommune(name: string) {
  profile.value.commune = name
  communeQuery.value = name
  communeDropdownOpen.value = false
}

function onCommuneInput() {
  communeDropdownOpen.value = true
  if (communeQuery.value !== profile.value.commune) {
    profile.value.commune = undefined
  }
}

function closeDropdown() {
  setTimeout(() => { communeDropdownOpen.value = false }, 150)
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(() => {
  for (const q of props.survey.questions) {
    if (q.type === 'scale') {
      const mid = Math.ceil(((q.min ?? 1) + (q.max ?? 5)) / 2)
      answers.value[q.id] = mid
    }
  }
  try {
    const saved = localStorage.getItem('peyi_citizen_profile')
    if (saved) {
      const parsed = JSON.parse(saved) as CitizenProfile
      profile.value = parsed
      if (parsed.commune) communeQuery.value = parsed.commune
      hasExistingProfile.value = true
    }
  } catch { /* ignore */ }
})

// ── Navigation ────────────────────────────────────────────────────────────────
const questions = computed(() => props.survey.questions ?? [])
const hasQuestions = computed(() => questions.value.length > 0)
const current = computed<SurveyQuestion | null>(
  () => questions.value[currentIndex.value] ?? null,
)
const isLast = computed(() => currentIndex.value === questions.value.length - 1)

function canAdvance(): boolean {
  const q = current.value
  if (!q || !q.required) return true
  const ans = answers.value[q.id]
  if (q.type === 'multiple') return Array.isArray(ans) && ans.length > 0
  if (q.type === 'text') return true
  return ans !== undefined && ans !== ''
}

function next() {
  if (!canAdvance()) return
  direction.value = 'forward'
  if (isLast.value) {
    phase.value = 'demo'
  } else {
    currentIndex.value++
  }
}

function prev() {
  if (phase.value === 'demo') {
    phase.value = 'questions'
    return
  }
  if (currentIndex.value > 0) {
    direction.value = 'back'
    currentIndex.value--
  } else {
    router.back()
  }
}

function selectSingle(questionId: string, opt: string) {
  answers.value[questionId] = opt
  setTimeout(next, 300)
}

function toggleMultiple(questionId: string, opt: string) {
  const cur = (answers.value[questionId] as string[]) ?? []
  answers.value[questionId] = cur.includes(opt)
    ? cur.filter(v => v !== opt)
    : [...cur, opt]
}

function selectScale(questionId: string, val: number) {
  answers.value[questionId] = val
}

// ── Soumission ────────────────────────────────────────────────────────────────
async function submit() {
  submitting.value = true
  try {
    localStorage.setItem('peyi_citizen_profile', JSON.stringify(profile.value))
  } catch { /* ignore */ }

  const demographics: SurveyDemographics = {
    age_group: profile.value.age_group,
    gender: profile.value.gender,
    commune: profile.value.commune,
    employment_status: profile.value.employment_status,
    sector: profile.value.sector,
  }

  try {
    await store.submitResponse({
      survey_id: props.survey.id,
      respondent_id: getOrCreateRespondentId(),
      answers: answers.value,
      demographics,
    })
    phase.value = 'done'
    communesStore.triggerRefresh(profile.value.commune ?? null)
  } finally {
    submitting.value = false
  }
}

// Emoji scale
const scaleEmojis = ['😠', '😟', '😐', '🙂', '😊', '😄', '🤩']
function scaleEmoji(val: number, max: number): string {
  const idx = Math.round(((Number(val) - 1) / (max - 1)) * (scaleEmojis.length - 1))
  return scaleEmojis[Math.max(0, Math.min(idx, scaleEmojis.length - 1))]
}

const genderOpts: { v: Gender; l: string }[] = [
  { v: 'femme', l: 'Femme' },
  { v: 'homme', l: 'Homme' },
  { v: 'autre', l: 'Autre' },
  { v: 'préfère_ne_pas_répondre', l: 'Ne pas préciser' },
]

const employmentOpts = [
  { v: 'actif' as EmploymentStatus, l: 'En activité 💼' },
  { v: 'etudiant' as EmploymentStatus, l: 'Étudiant(e) 🎓' },
  { v: 'retraite' as EmploymentStatus, l: 'Retraité(e) 🌴' },
  { v: 'sans_emploi' as EmploymentStatus, l: 'Sans emploi' },
]

const sectorOpts = [
  'Public / Fonctionnaire',
  'Privé / Salarié',
  'Indépendant / Entrepreneur',
  'Agriculture / Pêche',
  'Tourisme / Commerce',
  'Autre secteur',
]

function toggleEmployment(v: EmploymentStatus) {
  if (profile.value.employment_status === v) {
    profile.value.employment_status = undefined
  } else {
    profile.value.employment_status = v
    if (v !== 'actif') profile.value.sector = undefined
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-gray-950 flex flex-col">

    <!-- ── Garde : aucune question ── -->
    <div v-if="!hasQuestions" class="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div class="text-5xl mb-4">⚠️</div>
      <h2 class="text-white text-2xl font-bold mb-2">Sondage indisponible</h2>
      <p class="text-white/50 text-sm mb-6">Ce sondage ne contient pas encore de questions.</p>
      <button
        class="px-6 py-3 rounded-2xl bg-white/10 text-white font-semibold hover:bg-white/20 transition"
        @click="router.back()"
      >← Retour</button>
    </div>

    <template v-else>
    <!-- ── Barre de progression ── -->
    <div class="flex gap-1 px-4 pt-safe pt-4 pb-0 shrink-0">
      <div
        v-for="(q, i) in questions"
        :key="q.id"
        class="h-0.5 flex-1 rounded-full transition-all duration-300"
        :class="i < currentIndex || phase !== 'questions'
          ? 'bg-white'
          : i === currentIndex && phase === 'questions'
            ? 'bg-white/50'
            : 'bg-white/20'"
      />
    </div>

    <!-- ── Header ── -->
    <div class="flex items-center justify-between px-4 pt-3 pb-0 shrink-0">
      <button class="text-white/60 hover:text-white p-1 transition" @click="prev">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="text-center">
        <p class="text-white/50 text-xs font-medium">
          <span v-if="phase === 'questions'">{{ currentIndex + 1 }} / {{ questions.length }}</span>
          <span v-else-if="phase === 'demo'">Votre profil</span>
          <span v-else>Terminé</span>
        </p>
        <p class="text-white/30 text-[10px] mt-0.5">~{{ Math.max(1, Math.ceil(questions.length * 12 / 60)) }} min</p>
      </div>
      <button class="text-white/40 hover:text-white/70 text-xs p-1 transition" @click="router.back()">✕</button>
    </div>

    <!-- ── Contenu principal ── -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <!-- Phase : Questions -->
      <Transition :name="direction === 'forward' ? 'slide-left' : 'slide-right'" mode="out-in">
        <div
          v-if="phase === 'questions' && current"
          :key="currentIndex"
          class="flex-1 flex flex-col px-5 pt-4 pb-5 gap-4"
        >
          <!-- ── Card question ── -->
          <div
            class="relative rounded-3xl overflow-hidden flex-1 flex flex-col justify-between p-6 min-h-0"
            style="background: linear-gradient(145deg, #059669 0%, #0891b2 100%)"
          >
            <div class="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
            <div class="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-black/10 pointer-events-none" />
            <div class="relative z-10">
              <span class="inline-flex items-center gap-1.5 bg-black/20 text-white/80 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block animate-pulse" />
                Question {{ currentIndex + 1 }} / {{ questions.length }}
              </span>
            </div>
            <p class="relative z-10 text-white text-[26px] font-black leading-tight text-center flex-1 flex items-center justify-center py-4">
              {{ current.label }}
            </p>
            <div class="relative z-10 text-center">
              <span v-if="current.type === 'single' || current.type === 'radio'" class="text-white/50 text-xs">Choix unique</span>
              <span v-else-if="current.type === 'multiple'" class="text-white/50 text-xs">Plusieurs réponses possibles</span>
              <span v-else-if="current.type === 'scale'" class="text-white/50 text-xs">Note de {{ current.min ?? 1 }} à {{ current.max ?? 5 }}</span>
            </div>
          </div>

          <!-- Radio (single choice) -->
          <div v-if="current.type === 'single' || current.type === 'radio'" class="space-y-2.5 shrink-0">
            <button
              v-for="(opt, idx) in current.options"
              :key="opt"
              class="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98]"
              :class="answers[current.id] === opt
                ? 'bg-emerald-500 border-emerald-400 scale-[1.01]'
                : 'bg-white/8 border-white/12 hover:bg-white/14 hover:border-white/25'"
              @click="selectSingle(current.id, opt)"
            >
              <span
                class="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all"
                :class="answers[current.id] === opt ? 'bg-white/25 text-white' : 'bg-white/10 text-white/50'"
              >{{ String.fromCharCode(65 + idx) }}</span>
              <span class="text-white font-semibold text-[15px] flex-1 text-left">{{ opt }}</span>
              <svg v-if="answers[current.id] === opt" class="w-5 h-5 text-white shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>

          <!-- Choix multiples -->
          <div v-else-if="current.type === 'multiple'" class="space-y-2.5 shrink-0">
            <button
              v-for="(opt, idx) in current.options"
              :key="opt"
              class="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98]"
              :class="(answers[current.id] as string[] ?? []).includes(opt)
                ? 'bg-emerald-500 border-emerald-400'
                : 'bg-white/8 border-white/12 hover:bg-white/14 hover:border-white/25'"
              @click="toggleMultiple(current.id, opt)"
            >
              <span
                class="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                :class="(answers[current.id] as string[] ?? []).includes(opt) ? 'bg-white/25 text-white' : 'bg-white/10 text-white/50'"
              >{{ String.fromCharCode(65 + idx) }}</span>
              <span class="text-white font-semibold text-[15px] flex-1 text-left">{{ opt }}</span>
              <svg v-if="(answers[current.id] as string[] ?? []).includes(opt)" class="w-5 h-5 text-white shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </button>
            <button
              class="w-full py-4 rounded-2xl font-bold text-base mt-1 transition active:scale-[0.98]"
              :class="(answers[current.id] as string[] ?? []).length > 0 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/30 cursor-not-allowed'"
              :disabled="(answers[current.id] as string[] ?? []).length === 0"
              @click="next"
            >Continuer →</button>
          </div>

          <!-- Échelle -->
          <div v-else-if="current.type === 'scale'" class="space-y-4 shrink-0">
            <div class="text-center text-5xl transition-all duration-200">
              {{ scaleEmoji(Number(answers[current!.id] ?? current!.min ?? 1), current!.max ?? 5) }}
            </div>
            <div class="flex gap-2 justify-center flex-wrap">
              <button
                v-for="n in Array.from({ length: (current!.max ?? 5) - (current!.min ?? 1) + 1 }, (_, i) => (current!.min ?? 1) + i)"
                :key="n"
                class="w-12 h-12 rounded-2xl font-black text-base transition-all duration-150 active:scale-95"
                :class="answers[current.id] === n
                  ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/40'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'"
                @click="selectScale(current.id, n)"
              >{{ n }}</button>
            </div>
            <div class="flex justify-between text-white/40 text-xs px-1">
              <span>😞 Très insatisfait</span>
              <span>Très satisfait 😊</span>
            </div>
            <button
              class="w-full py-4 rounded-2xl font-bold text-base transition active:scale-[0.98]"
              :class="answers[current.id] !== undefined ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/30'"
              @click="next"
            >Continuer →</button>
          </div>

          <!-- Texte libre -->
          <div v-else-if="current.type === 'text'" class="space-y-3 shrink-0">
            <textarea
              v-model="answers[current.id] as string"
              rows="4"
              class="w-full bg-white/10 border-2 border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-base resize-none focus:outline-none focus:border-emerald-500"
              placeholder="Votre réponse (facultatif)…"
            />
            <button
              class="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-base transition hover:bg-emerald-400"
              @click="next"
            >{{ answers[current.id] ? 'Continuer →' : 'Passer →' }}</button>
          </div>
        </div>
      </Transition>

      <!-- ── Phase : Profil Citoyen ── -->
      <div v-if="phase === 'demo'" class="flex-1 flex flex-col px-5 pt-5 pb-5 overflow-y-auto gap-5">

        <!-- En-tête -->
        <div>
          <h2 class="text-white text-2xl font-black">Votre profil</h2>
          <p v-if="hasExistingProfile" class="text-gray-400 text-xs italic mt-1">
            Votre profil est déjà enregistré — modifiez si nécessaire
          </p>
        </div>

        <!-- Commune -->
        <div>
          <p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">VOTRE COMMUNE</p>
          <div class="relative">
            <input
              v-model="communeQuery"
              type="text"
              placeholder="Recherchez votre commune..."
              class="w-full bg-white/10 border-2 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-[15px] focus:outline-none transition"
              :class="profile.commune ? 'border-emerald-500' : 'border-white/15 focus:border-emerald-500'"
              @focus="communeDropdownOpen = true"
              @input="onCommuneInput"
              @blur="closeDropdown"
            />
            <span v-if="profile.commune" class="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-lg">✓</span>
            <!-- Dropdown -->
            <div
              v-if="communeDropdownOpen && filteredCommunes.length"
              class="absolute top-full mt-1 w-full bg-gray-900 border border-white/15 rounded-2xl overflow-hidden z-20 shadow-xl"
              style="max-height: 180px; overflow-y: auto;"
            >
              <button
                v-for="c in filteredCommunes"
                :key="c"
                class="w-full text-left px-4 py-2.5 text-[15px] hover:bg-white/10 transition"
                :class="profile.commune === c ? 'text-emerald-400 font-semibold' : 'text-white'"
                @mousedown.prevent="selectCommune(c)"
              >{{ c }}</button>
            </div>
          </div>
        </div>

        <!-- Tranche d'âge -->
        <div>
          <p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">TRANCHE D'ÂGE</p>
          <div class="flex gap-2 overflow-x-auto pb-1" style="scrollbar-width: none;">
            <button
              v-for="ag in (['15-24', '25-34', '35-49', '50-64', '65+'] as AgeGroup[])"
              :key="ag"
              class="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition shrink-0"
              :class="profile.age_group === ag ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-300'"
              @click="profile.age_group = profile.age_group === ag ? undefined : ag"
            >{{ ag }} ans</button>
          </div>
        </div>

        <!-- Genre -->
        <div>
          <p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">GENRE</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="g in genderOpts"
              :key="g.v"
              class="px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition"
              :class="g.v === 'préfère_ne_pas_répondre'
                ? (profile.gender === g.v ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-transparent border-gray-700 text-gray-500')
                : (profile.gender === g.v ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-gray-800 border-transparent text-gray-300')"
              @click="profile.gender = profile.gender === g.v ? undefined : g.v"
            >{{ g.l }}</button>
          </div>
        </div>

        <!-- Situation professionnelle -->
        <div>
          <p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">SITUATION</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="e in employmentOpts"
              :key="e.v"
              class="px-4 py-2 rounded-full text-sm font-semibold transition"
              :class="profile.employment_status === e.v ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-300'"
              @click="toggleEmployment(e.v)"
            >{{ e.l }}</button>
          </div>
        </div>

        <!-- Secteur (visible si En activité) -->
        <Transition name="fade">
          <div v-if="profile.employment_status === 'actif'">
            <p class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">SECTEUR</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in sectorOpts"
                :key="s"
                class="px-4 py-2 rounded-full text-sm font-semibold transition"
                :class="profile.sector === s ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-300'"
                @click="profile.sector = profile.sector === s ? undefined : s"
              >{{ s }}</button>
            </div>
          </div>
        </Transition>

        <!-- Confidentialité -->
        <p class="text-gray-500 text-xs text-center italic">
          🔒 Ces données restent anonymes et ne sont jamais associées à votre identité. Elles servent uniquement à segmenter les résultats par profil.
        </p>

        <!-- Bouton unique -->
        <button
          :disabled="submitting"
          class="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-base transition hover:bg-emerald-500 disabled:opacity-50"
          @click="submit"
        >{{ submitting ? 'Envoi…' : 'Envoyer mes réponses 🎉' }}</button>
      </div>

      <!-- ── Phase : Terminé ── -->
      <div v-if="phase === 'done'" class="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div class="text-7xl mb-6 animate-bounce">🎉</div>
        <h2 class="text-white text-3xl font-bold mb-3">Merci !</h2>
        <p class="text-white/60 text-base mb-8">Votre voix est maintenant sur la carte de la Guadeloupe.</p>
        <button
          class="w-full py-4 rounded-2xl bg-white text-gray-900 font-bold text-base mb-3"
          @click="router.push(`/sondages/${survey.id}`)"
        >Voir les résultats 📊</button>
        <button
          class="w-full py-3 text-white/50 text-sm"
          @click="router.push('/')"
        >Retour à la carte</button>
      </div>
    </div>
    </template>
  </div>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-left-enter-from  { transform: translateX(60px);  opacity: 0; }
.slide-left-leave-to    { transform: translateX(-60px); opacity: 0; }
.slide-right-enter-from { transform: translateX(-60px); opacity: 0; }
.slide-right-leave-to   { transform: translateX(60px);  opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s, transform 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
