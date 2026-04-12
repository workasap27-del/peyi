<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'

const totalRespondents = ref(0)
const activeSurveys = ref(0)
const participatingCommunes = ref(0)

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
})

function fmt(n: number): string {
  return n.toLocaleString('fr-FR')
}
</script>

<template>
  <div class="absolute top-0 inset-x-0 z-[1001] pointer-events-none">
    <div class="mx-auto max-w-lg mt-2 px-4 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs text-center font-medium tracking-wide">
      <span class="text-emerald-400">{{ fmt(totalRespondents) }} citoyens</span>
      <span class="text-white/40 mx-1.5">·</span>
      <span>{{ activeSurveys }} sondage{{ activeSurveys !== 1 ? 's' : '' }} actif{{ activeSurveys !== 1 ? 's' : '' }}</span>
      <span class="text-white/40 mx-1.5">·</span>
      <span>{{ participatingCommunes }} commune{{ participatingCommunes !== 1 ? 's' : '' }} participante{{ participatingCommunes !== 1 ? 's' : '' }}</span>
    </div>
  </div>
</template>
