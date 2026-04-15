<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'

const activeSurveysCount = ref(0)
const uniqueCitizens = ref(0)
const loaded = ref(false)

onMounted(async () => {
  try {
    const [{ count: sCount }, { data: rData }] = await Promise.all([
      supabase.from('surveys').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('survey_responses').select('respondent_id'),
    ])
    activeSurveysCount.value = sCount ?? 0
    const unique = new Set<string>((rData ?? []).map((r: any) => r.respondent_id).filter(Boolean))
    uniqueCitizens.value = unique.size
  } catch { /* silencieux */ }
  finally { loaded.value = true }
})

const hasData = computed(() => activeSurveysCount.value > 0 || uniqueCitizens.value > 0)

function fmt(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}
</script>

<template>
  <div class="absolute top-4 left-4 z-[1001] pointer-events-none">
    <div
      class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border border-white/50"
      style="background: rgba(255,255,255,0.90); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
    >
      <!-- Partie gauche : logo -->
      <div>
        <p class="font-bold text-xl leading-none" style="color: #10b981;">Péyi</p>
        <p class="text-gray-500 text-xs mt-0.5 whitespace-nowrap">
          {{ hasData ? 'Guadeloupe · Temps réel' : 'Guadeloupe' }}
        </p>
      </div>

      <!-- Divider vertical -->
      <div v-if="hasData && loaded" class="w-px self-stretch bg-gray-200 mx-1" />

      <!-- Partie droite : stats -->
      <template v-if="hasData && loaded">
        <!-- Bloc sondages actifs -->
        <div class="text-center">
          <div class="flex items-center justify-center gap-1 mb-0.5">
            <span class="text-base leading-none">📝</span>
            <span class="text-gray-900 font-bold text-lg leading-none">{{ fmt(activeSurveysCount) }}</span>
          </div>
          <p class="text-gray-400 text-[10px] uppercase tracking-wider">sondages</p>
        </div>

        <!-- Divider -->
        <div class="w-px self-stretch bg-gray-200" />

        <!-- Bloc citoyens -->
        <div class="text-center relative">
          <div class="flex items-center justify-center gap-1 mb-0.5">
            <span class="text-base leading-none">👥</span>
            <span class="text-gray-900 font-bold text-lg leading-none">{{ fmt(uniqueCitizens) }}</span>
            <!-- Ping vert -->
            <span v-if="uniqueCitizens > 0" class="relative flex h-2 w-2 ml-0.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p class="text-gray-400 text-[10px] uppercase tracking-wider">citoyens</p>
        </div>
      </template>
    </div>
  </div>
</template>
