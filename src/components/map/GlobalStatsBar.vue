<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'

const totalRespondents = ref(0)
const activeSurveys = ref(0)
const participatingCommunes = ref(0)
const loaded = ref(false)

onMounted(async () => {
  try {
    // Total répondants
    const { count: rCount } = await supabase
      .from('survey_responses')
      .select('*', { count: 'exact', head: true })
    totalRespondents.value = rCount ?? 0

    // Sondages actifs
    const { count: sCount } = await supabase
      .from('surveys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    activeSurveys.value = sCount ?? 0

    // Communes participantes (avec au moins 1 répondant)
    const { data: commData } = await supabase
      .from('survey_responses')
      .select('demographics')
    const communes = new Set<string>()
    for (const r of commData ?? []) {
      const c = (r.demographics as any)?.commune
      if (c) communes.add(c)
    }
    participatingCommunes.value = communes.size
  } catch { /* silencieux */ }
  finally { loaded.value = true }
})

const allZero = computed(() =>
  loaded.value && totalRespondents.value === 0 && activeSurveys.value === 0
)

function fmt(n: number): string {
  return n.toLocaleString('fr-FR')
}
</script>

<template>
  <div class="absolute top-0 inset-x-0 z-[1001] pointer-events-none">
    <div class="mx-auto max-w-lg mt-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-2xl text-white text-center shadow-lg">
      <template v-if="allZero">
        <p class="text-sm font-medium text-white/80">Sois parmi les premiers à donner ton avis 👇</p>
      </template>
      <template v-else>
        <p class="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Guadeloupe — Tous sondages</p>
        <p class="text-xs font-medium leading-snug">
          <span class="text-emerald-400 font-bold">{{ fmt(totalRespondents) }} citoyens ont répondu</span>
          <span class="text-white/30 mx-1.5">·</span>
          <span>{{ activeSurveys }} sondage{{ activeSurveys !== 1 ? 's' : '' }} actif{{ activeSurveys !== 1 ? 's' : '' }}</span>
          <span class="text-white/30 mx-1.5">·</span>
          <span>{{ participatingCommunes }} commune{{ participatingCommunes !== 1 ? 's' : '' }} participante{{ participatingCommunes !== 1 ? 's' : '' }}</span>
        </p>
      </template>
    </div>
  </div>
</template>
