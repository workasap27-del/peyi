<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Survey, SurveyResponse, AgeGroup, Gender } from '@/types'

const props = defineProps<{
  survey: Survey
  responses: SurveyResponse[]
}>()

type DemoFilter = { age_group?: AgeGroup; gender?: Gender }
const filter = ref<DemoFilter>({})

const ageGroups: AgeGroup[] = ['15-24', '25-34', '35-49', '50-64', '65+']
const genders: { value: Gender; label: string }[] = [
  { value: 'homme', label: 'Hommes' },
  { value: 'femme', label: 'Femmes' },
]

const filtered = computed(() => {
  return props.responses.filter((r) => {
    if (filter.value.age_group && r.demographics.age_group !== filter.value.age_group) return false
    if (filter.value.gender && r.demographics.gender !== filter.value.gender) return false
    return true
  })
})

const total = computed(() => filtered.value.length)

/** Compte les occurrences d'une option pour une question donnée */
function countOption(questionId: string, option: string): number {
  return filtered.value.filter((r) => {
    const ans = r.answers[questionId]
    if (Array.isArray(ans)) return ans.includes(option)
    return ans === option
  }).length
}

/** Moyenne d'une question de type scale */
function avgScale(questionId: string): number {
  const vals = filtered.value
    .map((r) => Number(r.answers[questionId]))
    .filter((v) => !isNaN(v) && v > 0)
  if (!vals.length) return 0
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

/** Distribution par tranche d'âge */
const ageDistribution = computed(() => {
  const out: Record<string, number> = {}
  for (const ag of ageGroups) {
    out[ag] = props.responses.filter((r) => r.demographics.age_group === ag).length
  }
  return out
})

/** Distribution par genre */
const genderDistribution = computed(() => ({
  homme: props.responses.filter((r) => r.demographics.gender === 'homme').length,
  femme: props.responses.filter((r) => r.demographics.gender === 'femme').length,
  autre: props.responses.filter((r) => r.demographics.gender === 'autre').length,
}))

function pct(n: number, base?: number): number {
  const b = base ?? total.value
  return b === 0 ? 0 : Math.round((n / b) * 100)
}

const COLORS = [
  'bg-emerald-500', 'bg-teal-500', 'bg-blue-500',
  'bg-violet-500', 'bg-amber-500', 'bg-rose-500',
]
</script>

<template>
  <div class="space-y-8">
    <!-- Header résultats -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-bold">Résultats</h2>
        <p class="text-sm text-gray-500">
          {{ total }} réponse{{ total > 1 ? 's' : '' }}
          <span v-if="filter.age_group || filter.gender" class="text-emerald-700 font-medium">
            (filtrées)
          </span>
        </p>
      </div>
      <span class="text-3xl font-bold text-emerald-700">{{ props.responses.length }}</span>
    </div>

    <!-- Filtres démographiques -->
    <div class="bg-gray-50 rounded-xl p-4 space-y-3">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Segmenter les résultats</p>
      <div class="flex flex-wrap gap-2">
        <!-- Âge -->
        <button
          v-for="ag in ageGroups"
          :key="ag"
          class="px-3 py-1 rounded-full text-xs font-medium border transition"
          :class="filter.age_group === ag
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'"
          @click="filter.age_group = filter.age_group === ag ? undefined : ag"
        >
          {{ ag }} ans
        </button>
        <div class="w-px bg-gray-200 mx-1" />
        <!-- Genre -->
        <button
          v-for="g in genders"
          :key="g.value"
          class="px-3 py-1 rounded-full text-xs font-medium border transition"
          :class="filter.gender === g.value
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'"
          @click="filter.gender = filter.gender === g.value ? undefined : g.value"
        >
          {{ g.label }}
        </button>
        <button
          v-if="filter.age_group || filter.gender"
          class="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200"
          @click="filter = {}"
        >
          ✕ Effacer
        </button>
      </div>
    </div>

    <!-- Résultats par question -->
    <div
      v-for="question in survey.questions"
      :key="question.id"
      class="bg-white border border-gray-100 rounded-xl p-5"
    >
      <p class="font-medium text-sm mb-4 text-gray-800">{{ question.label }}</p>

      <!-- Single / Multiple → barres horizontales -->
      <div v-if="question.type === 'single' || question.type === 'multiple'" class="space-y-3">
        <div
          v-for="(opt, idx) in question.options"
          :key="opt"
          class="space-y-1"
        >
          <div class="flex justify-between text-xs text-gray-600">
            <span>{{ opt }}</span>
            <span class="font-semibold">{{ pct(countOption(question.id, opt)) }}%
              <span class="text-gray-400 font-normal">({{ countOption(question.id, opt) }})</span>
            </span>
          </div>
          <div class="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="COLORS[idx % COLORS.length]"
              :style="{ width: pct(countOption(question.id, opt)) + '%' }"
            />
          </div>
        </div>
      </div>

      <!-- Scale → jauge + moyenne -->
      <div v-else-if="question.type === 'scale'" class="space-y-3">
        <div class="flex items-end gap-3">
          <span class="text-4xl font-bold text-emerald-700">{{ avgScale(question.id).toFixed(1) }}</span>
          <span class="text-gray-400 text-sm pb-1">/ {{ question.max ?? 10 }}</span>
        </div>
        <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
            :style="{ width: (avgScale(question.id) / (question.max ?? 10) * 100) + '%' }"
          />
        </div>
        <!-- Distribution min→max -->
        <div class="flex items-end gap-1 h-16 mt-2">
          <div
            v-for="val in Array.from({ length: (question.max ?? 10) - (question.min ?? 1) + 1 }, (_, i) => (question.min ?? 1) + i)"
            :key="val"
            class="flex-1 bg-emerald-100 rounded-t relative group"
            :style="{
              height: (filtered.filter(r => Number(r.answers[question.id]) === val).length /
                (total || 1) * 100 * 4).toFixed(0) + 'px',
              minHeight: '4px'
            }"
          >
            <span class="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-gray-500 hidden group-hover:block bg-white px-1 rounded shadow">
              {{ val }}
            </span>
          </div>
        </div>
        <div class="flex justify-between text-xs text-gray-400">
          <span>{{ question.min ?? 1 }} — Très insatisfait</span>
          <span>{{ question.max ?? 10 }} — Très satisfait</span>
        </div>
      </div>

      <!-- Text → compteur uniquement -->
      <div v-else-if="question.type === 'text'" class="text-sm text-gray-500 italic">
        {{ filtered.filter(r => r.answers[question.id]).length }} réponses texte libres
        <span class="text-xs">(analyse qualitative)</span>
      </div>
    </div>

    <!-- Démographie globale -->
    <div class="bg-white border border-gray-100 rounded-xl p-5">
      <p class="font-semibold text-sm mb-4">Profil des répondants</p>
      <div class="grid grid-cols-2 gap-6">
        <!-- Âge -->
        <div>
          <p class="text-xs text-gray-500 mb-3 font-medium">Tranche d'âge</p>
          <div class="space-y-2">
            <div v-for="ag in ageGroups" :key="ag" class="space-y-0.5">
              <div class="flex justify-between text-xs text-gray-600">
                <span>{{ ag }} ans</span>
                <span>{{ pct(ageDistribution[ag], props.responses.length) }}%</span>
              </div>
              <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-violet-400 rounded-full"
                  :style="{ width: pct(ageDistribution[ag], props.responses.length) + '%' }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Genre -->
        <div>
          <p class="text-xs text-gray-500 mb-3 font-medium">Genre</p>
          <div class="space-y-2">
            <div v-for="[label, count, color] in ([
              ['Femmes', genderDistribution.femme, 'bg-pink-400'],
              ['Hommes', genderDistribution.homme, 'bg-blue-400'],
              ['Autre', genderDistribution.autre, 'bg-gray-300'],
            ] as [string, number, string][])" :key="label" class="space-y-0.5">
              <div class="flex justify-between text-xs text-gray-600">
                <span>{{ label }}</span>
                <span>{{ pct(count, props.responses.length) }}%</span>
              </div>
              <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full"
                  :class="color"
                  :style="{ width: pct(count, props.responses.length) + '%' }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
