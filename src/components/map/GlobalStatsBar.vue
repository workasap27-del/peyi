<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'

const activeSurveysCount = ref(0)
const uniqueCitizens = ref(0)
const loaded = ref(false)

// ── Météo ─────────────────────────────────────────────────────────────────────
const weatherEmoji = ref('🌤️')
const weatherTemp = ref<number | null>(null)
let weatherTimer: ReturnType<typeof setInterval> | null = null

const WEATHER_CODE_MAP: [number, number, string][] = [
  [0,   0,   '☀️'],
  [1,   3,   '⛅'],
  [45,  48,  '🌫️'],
  [51,  67,  '🌧️'],
  [80,  82,  '🌦️'],
  [95,  99,  '⛈️'],
]

function mapWeatherCode(code: number): string {
  for (const [min, max, emoji] of WEATHER_CODE_MAP) {
    if (code >= min && code <= max) return emoji
  }
  return '🌤️'
}

async function fetchWeather() {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=16.0078&longitude=-61.7541&current=temperature_2m,weathercode&timezone=America%2FGuadeloupe'
    )
    if (!res.ok) return
    const data = await res.json()
    weatherEmoji.value = mapWeatherCode(data.current.weathercode ?? 0)
    weatherTemp.value = Math.round(data.current.temperature_2m ?? 0)
  } catch { /* réseau indisponible — garder la valeur actuelle */ }
}

// ── Horloge UTC-4 ─────────────────────────────────────────────────────────────
const clockH = ref('--')
const clockM = ref('--')
const clockS = ref('--')
const colonVisible = ref(true)
let clockTimer: ReturnType<typeof setInterval> | null = null

function updateClock() {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
  const gwDate = new Date(utcMs - 4 * 3600000)
  clockH.value = String(gwDate.getHours()).padStart(2, '0')
  clockM.value = String(gwDate.getMinutes()).padStart(2, '0')
  clockS.value = String(gwDate.getSeconds()).padStart(2, '0')
  colonVisible.value = !colonVisible.value
}

// ── Stats Supabase — rechargement toutes les 60s ──────────────────────────────
let statsTimer: ReturnType<typeof setInterval> | null = null

async function fetchStats() {
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
}

onMounted(async () => {
  await fetchStats()
  statsTimer = setInterval(fetchStats, 60 * 1000)

  // Météo initiale + rafraîchissement toutes les 10 min
  fetchWeather()
  weatherTimer = setInterval(fetchWeather, 10 * 60 * 1000)

  // Horloge toutes les secondes
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (statsTimer) clearInterval(statsTimer)
  if (weatherTimer) clearInterval(weatherTimer)
  if (clockTimer) clearInterval(clockTimer)
})

const hasData = computed(() => activeSurveysCount.value > 0 || uniqueCitizens.value > 0)

function fmt(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}
</script>

<template>
  <div class="absolute top-4 left-4 z-[1001] pointer-events-none">
    <div
      class="flex items-center gap-2 px-3 py-2.5 rounded-xl shadow-lg border border-white/50"
      style="background: rgba(255,255,255,0.90); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
    >
      <!-- Logo Péyi -->
      <div class="shrink-0">
        <p class="font-bold text-xl leading-none" style="color: #10b981;">Péyi</p>
        <p class="text-gray-500 text-[10px] mt-0.5 whitespace-nowrap">Guadeloupe</p>
      </div>

      <!-- Stats sondages + citoyens — masquées sur mobile <640px -->
      <template v-if="hasData && loaded">
        <div class="hidden sm:block w-px self-stretch bg-gray-200 mx-0.5" />
        <div class="hidden sm:block text-center">
          <div class="flex items-center justify-center gap-1 mb-0.5">
            <span class="text-sm leading-none">📝</span>
            <span class="text-gray-900 font-bold text-base leading-none">{{ fmt(activeSurveysCount) }}</span>
          </div>
          <p class="text-gray-400 text-[9px] uppercase tracking-wider">sondages actifs</p>
        </div>
        <div class="hidden sm:block w-px self-stretch bg-gray-200" />
        <div class="hidden sm:block text-center relative">
          <div class="flex items-center justify-center gap-1 mb-0.5">
            <span class="text-sm leading-none">👥</span>
            <span class="text-gray-900 font-bold text-base leading-none">{{ fmt(uniqueCitizens) }}</span>
            <span v-if="uniqueCitizens > 0" class="relative flex h-2 w-2 ml-0.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p class="text-gray-400 text-[9px] uppercase tracking-wider">citoyens actifs</p>
        </div>
      </template>

      <!-- Divider -->
      <div class="w-px self-stretch bg-gray-200 mx-0.5" />

      <!-- Météo -->
      <div class="text-center shrink-0">
        <div class="flex items-center gap-1">
          <span class="text-xl leading-none">{{ weatherEmoji }}</span>
          <span class="text-gray-900 font-bold text-base leading-none">
            {{ weatherTemp !== null ? weatherTemp : '--' }}
          </span>
          <span class="text-gray-500 text-xs">°C</span>
        </div>
        <p class="text-gray-400 text-[9px] uppercase tracking-wider mt-0.5">Météo</p>
      </div>

      <!-- Divider -->
      <div class="w-px self-stretch bg-gray-200 mx-0.5" />

      <!-- Horloge UTC-4 -->
      <div class="text-center shrink-0">
        <div class="flex items-baseline gap-0.5">
          <span class="font-mono font-bold text-base text-gray-900">{{ clockH }}</span>
          <span class="font-mono font-bold text-base text-gray-900" :class="colonVisible ? 'opacity-100' : 'opacity-0'">:</span>
          <span class="font-mono font-bold text-base text-gray-900">{{ clockM }}</span>
          <span class="font-mono text-xs text-gray-400 ml-0.5">{{ clockS }}</span>
        </div>
        <p class="text-gray-400 text-[9px] uppercase tracking-wider">UTC-4</p>
      </div>
    </div>
  </div>
</template>
