<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

// Init scales à 5
onMounted(() => {
  for (const q of props.survey.questions) {
    if (q.type === 'scale') answers.value[q.id] = 5
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

// Auto-avance pour les questions single/scale
function selectSingle(questionId: string, opt: string) {
  answers.value[questionId] = opt
  setTimeout(next, 350)
}

function toggleMultiple(questionId: string, opt: string) {
  const cur = (answers.value[questionId] as string[]) ?? []
  answers.value[questionId] = cur.includes(opt)
    ? cur.filter(v => v !== opt)
    : [...cur, opt]
}

// ── Swipe ─────────────────────────────────────────────────────────────────────
const touchStartX = ref(0)
const touchStartY = ref(0)

function onTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX.value
  const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.value)
  if (dy > 60) return // scroll vertical → ignorer
  if (dx < -60) next()
  if (dx > 60) prev()
}

// Touches clavier
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === 'Enter') next()
  if (e.key === 'ArrowLeft' || e.key === 'Escape') prev()
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))

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

    // Recharger les données de participation depuis Supabase
    // et mémoriser la commune de l'utilisateur pour la pulse animation
    const commune = (demographics.value as any)?.commune ?? null
    communesStore.triggerRefresh(commune)
  } finally {
    submitting.value = false
  }
}

// Emoji scale
const scaleEmojis = ['😠', '😟', '😐', '🙂', '😊', '😄', '🤩']
function scaleEmoji(val: number): string {
  const idx = Math.round(((Number(val) - 1) / 9) * (scaleEmojis.length - 1))
  return scaleEmojis[idx]
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
  <div
    class="fixed inset-0 z-50 bg-gray-950 flex flex-col"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
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
          <span v-if="phase === 'questions'">
            {{ currentIndex + 1 }} / {{ questions.length }}
          </span>
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
      >
        ✕
      </button>
    </div>

    <!-- ── Contenu principal ── -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <!-- Phase : Questions -->
      <Transition :name="direction === 'forward' ? 'slide-left' : 'slide-right'" mode="out-in">
        <div
          v-if="phase === 'questions' && current"
          :key="currentIndex"
          class="flex-1 flex flex-col px-6 pt-8 pb-4"
        >
          <!-- Question -->
          <div class="flex-1 flex flex-col justify-center">
            <p class="text-white text-2xl font-bold leading-snug mb-8 text-center">
              {{ current.label }}
            </p>

            <!-- Single choice -->
            <div v-if="current.type === 'single'" class="space-y-3">
              <button
                v-for="opt in current.options"
                :key="opt"
                class="w-full text-left px-5 py-4 rounded-2xl border-2 text-white font-medium text-base transition-all duration-150"
                :class="answers[current.id] === opt
                  ? 'bg-emerald-600 border-emerald-500 scale-[1.02]'
                  : 'bg-white/10 border-white/20 hover:bg-white/20 active:scale-[0.98]'"
                @click="selectSingle(current.id, opt)"
              >
                {{ opt }}
              </button>
            </div>

            <!-- Multiple choice -->
            <div v-else-if="current.type === 'multiple'" class="space-y-3">
              <button
                v-for="opt in current.options"
                :key="opt"
                class="w-full text-left px-5 py-3.5 rounded-2xl border-2 text-white font-medium text-sm transition-all duration-150 flex items-center gap-3"
                :class="(answers[current.id] as string[] ?? []).includes(opt)
                  ? 'bg-emerald-600 border-emerald-500'
                  : 'bg-white/10 border-white/20 hover:bg-white/20'"
                @click="toggleMultiple(current.id, opt)"
              >
                <span
                  class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0"
                  :class="(answers[current.id] as string[] ?? []).includes(opt)
                    ? 'bg-white border-white'
                    : 'border-white/40'"
                >
                  <svg v-if="(answers[current.id] as string[] ?? []).includes(opt)" class="w-3 h-3 text-emerald-600" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                {{ opt }}
              </button>

              <!-- Bouton suivant pour multiple -->
              <button
                v-if="(answers[current.id] as string[] ?? []).length > 0"
                class="w-full py-4 rounded-2xl bg-white text-gray-900 font-bold text-base mt-2 transition hover:bg-gray-100 active:scale-[0.98]"
                @click="next"
              >
                Continuer →
              </button>
            </div>

            <!-- Scale — visuel émoji -->
            <div v-else-if="current.type === 'scale'" class="space-y-6">
              <div class="text-center text-6xl transition-all duration-200">
                {{ scaleEmoji(Number(answers[current!.id] ?? 5)) }}
              </div>
              <input
                type="range"
                min="1"
                max="10"
                class="w-full h-2 rounded-full appearance-none cursor-pointer"
                style="accent-color: #10b981"
                :value="answers[current!.id] ?? 5"
                @input="(e) => { answers[current!.id] = Number((e.target as HTMLInputElement).value) }"
              />
              <div class="flex justify-between text-white/40 text-xs">
                <span>Très insatisfait</span>
                <span>Très satisfait</span>
              </div>
              <button
                class="w-full py-4 rounded-2xl bg-white text-gray-900 font-bold text-base transition hover:bg-gray-100 active:scale-[0.98]"
                @click="next"
              >
                Continuer →
              </button>
            </div>

            <!-- Text libre -->
            <div v-else-if="current.type === 'text'" class="space-y-4">
              <textarea
                v-model="answers[current.id] as string"
                rows="4"
                class="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-base resize-none focus:outline-none focus:border-emerald-500"
                placeholder="Votre réponse (facultatif)…"
              />
              <button
                class="w-full py-4 rounded-2xl bg-white text-gray-900 font-bold text-base transition hover:bg-gray-100"
                @click="next"
              >
                {{ answers[current.id] ? 'Continuer →' : 'Passer →' }}
              </button>
            </div>
          </div>

          <!-- Hint swipe -->
          <p class="text-center text-white/20 text-xs mt-4">
            Swipe → ou ← pour naviguer
          </p>
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
              >
                {{ ag }} ans
              </button>
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
              >
                {{ g.l }}
              </button>
            </div>
          </div>
        </div>

        <button
          :disabled="submitting"
          class="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-base transition hover:bg-emerald-500 disabled:opacity-50"
          @click="submit"
        >
          {{ submitting ? 'Envoi…' : 'Envoyer mes réponses 🎉' }}
        </button>
        <button
          class="w-full py-3 text-white/40 text-sm mt-2"
          @click="submit"
        >
          Passer cette étape
        </button>
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
        >
          Voir les résultats 📊
        </button>
        <button
          class="w-full py-3 text-white/50 text-sm"
          @click="router.push('/')"
        >
          Retour à la carte
        </button>
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

input[type=range]::-webkit-slider-runnable-track {
  background: rgba(255,255,255,0.2);
  border-radius: 9999px;
  height: 8px;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  margin-top: -8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
</style>
