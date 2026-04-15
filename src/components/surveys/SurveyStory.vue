<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Survey, SurveyQuestion, AgeGroup, Gender, SurveyDemographics } from '@/types'
import { useSurveysStore } from '@/stores/surveys'
import { useCommunesStore } from '@/stores/communes'
import { getOrCreateRespondentId } from '@/lib/utils'

const props = defineProps<{ survey: Survey }>()
const router = useRouter()
const store = useSurveysStore()
const communesStore = useCommunesStore()

// ── État ─────────────────────────────────────────────────────────────────────
const currentIndex = ref(0)
const answers = ref<Record<string, string | string[] | number>>({})
const demographics = ref<SurveyDemographics>({})
const direction = ref<'forward' | 'back'>('forward')
const submitting = ref(false)
const phase = ref<'questions' | 'demo' | 'done'>('questions')

// Init scales à valeur médiane
onMounted(() => {
  for (const q of props.survey.questions) {
    if (q.type === 'scale') {
      const mid = Math.ceil(((q.min ?? 1) + (q.max ?? 5)) / 2)
      answers.value[q.id] = mid
    }
  }
})

// ── Navigation ────────────────────────────────────────────────────────────────
const questions = computed(() => props.survey.questions)
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

// Clic radio → sélection + avance automatique après 300ms
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

// Clic sur bouton numéroté scale → sélection
function selectScale(questionId: string, val: number) {
  answers.value[questionId] = val
}

// ── Soumission ────────────────────────────────────────────────────────────────
async function submit() {
  submitting.value = true
  try {
    await store.submitResponse({
      survey_id: props.survey.id,
      respondent_id: getOrCreateRespondentId(),
      answers: answers.value,
      demographics: demographics.value,
    })
    phase.value = 'done'
    const commune = (demographics.value as any)?.commune ?? null
    communesStore.triggerRefresh(commune)
  } finally {
    submitting.value = false
  }
}

// Emoji scale (pour affichage au-dessus des boutons)
const scaleEmojis = ['😠', '😟', '😐', '🙂', '😊', '😄', '🤩']
function scaleEmoji(val: number, max: number): string {
  const idx = Math.round(((Number(val) - 1) / (max - 1)) * (scaleEmojis.length - 1))
  return scaleEmojis[Math.max(0, Math.min(idx, scaleEmojis.length - 1))]
}

const ageGroups: AgeGroup[] = ['15-24', '25-34', '35-49', '50-64', '65+']
const genderOpts: { v: Gender; l: string }[] = [
  { v: 'femme', l: 'Femme' },
  { v: 'homme', l: 'Homme' },
  { v: 'autre', l: 'Autre' },
  { v: 'préfère_ne_pas_répondre', l: 'Ne pas préciser' },
]
</script>

<template>
  <div class="fixed inset-0 z-50 bg-gray-950 flex flex-col">
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
      <button
        class="text-white/60 hover:text-white p-1 transition"
        @click="prev"
      >
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
        <p class="text-white/30 text-[10px] mt-0.5">
          ~{{ Math.max(1, Math.ceil(questions.length * 12 / 60)) }} min
        </p>
      </div>

      <button
        class="text-white/40 hover:text-white/70 text-xs p-1 transition"
        @click="router.back()"
      >✕</button>
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
            <!-- Orbes décoratifs -->
            <div class="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
            <div class="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-black/10 pointer-events-none" />

            <!-- Badge question -->
            <div class="relative z-10">
              <span class="inline-flex items-center gap-1.5 bg-black/20 text-white/80 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block animate-pulse" />
                Question {{ currentIndex + 1 }} / {{ questions.length }}
              </span>
            </div>

            <!-- Texte question -->
            <p class="relative z-10 text-white text-[26px] font-black leading-tight text-center flex-1 flex items-center justify-center py-4">
              {{ current.label }}
            </p>

            <!-- Type indicator -->
            <div class="relative z-10 text-center">
              <span v-if="current.type === 'single' || current.type === 'radio'" class="text-white/50 text-xs">Choix unique</span>
              <span v-else-if="current.type === 'multiple'" class="text-white/50 text-xs">Plusieurs réponses possibles</span>
              <span v-else-if="current.type === 'scale'" class="text-white/50 text-xs">Note de {{ current.min ?? 1 }} à {{ current.max ?? 5 }}</span>
            </div>
          </div>

          <!-- ── Options ── -->

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
              :class="(answers[current.id] as string[] ?? []).length > 0
                ? 'bg-emerald-500 text-white'
                : 'bg-white/10 text-white/30 cursor-not-allowed'"
              :disabled="(answers[current.id] as string[] ?? []).length === 0"
              @click="next"
            >Continuer →</button>
          </div>

          <!-- Échelle : boutons numérotés -->
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

      <!-- Phase : Démographie -->
      <div v-if="phase === 'demo'" class="flex-1 flex flex-col px-6 pt-8 pb-4 overflow-y-auto">
        <div class="flex-1">
          <p class="text-white/60 text-sm font-medium mb-1 text-center">Optionnel</p>
          <h2 class="text-white text-2xl font-bold mb-2 text-center">Votre profil</h2>
          <p class="text-white/50 text-sm text-center mb-8">
            Aidez-nous à segmenter les résultats. Ces données restent anonymes.
          </p>

          <!-- Âge -->
          <div class="mb-6">
            <p class="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Tranche d'âge</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="ag in ageGroups"
                :key="ag"
                class="px-4 py-2 rounded-xl border-2 text-sm font-medium transition"
                :class="demographics.age_group === ag
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'"
                @click="demographics.age_group = demographics.age_group === ag ? undefined : ag"
              >{{ ag }} ans</button>
            </div>
          </div>

          <!-- Genre -->
          <div class="mb-8">
            <p class="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Genre</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="g in genderOpts"
                :key="g.v"
                class="px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition"
                :class="demographics.gender === g.v
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'"
                @click="demographics.gender = demographics.gender === g.v ? undefined : g.v"
              >{{ g.l }}</button>
            </div>
          </div>
        </div>

        <button
          :disabled="submitting"
          class="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-base transition hover:bg-emerald-500 disabled:opacity-50"
          @click="submit"
        >{{ submitting ? 'Envoi…' : 'Envoyer mes réponses 🎉' }}</button>
        <button
          class="w-full py-3 text-white/40 text-sm mt-2"
          @click="submit"
        >Passer cette étape</button>
      </div>

      <!-- Phase : Terminé -->
      <div v-if="phase === 'done'" class="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div class="text-7xl mb-6 animate-bounce">🎉</div>
        <h2 class="text-white text-3xl font-bold mb-3">Merci !</h2>
        <p class="text-white/60 text-base mb-8">
          Votre voix est maintenant sur la carte de la Guadeloupe.
        </p>
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
</style>
