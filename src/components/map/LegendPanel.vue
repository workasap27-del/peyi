<script setup lang="ts">
import { ref, onMounted } from 'vue'

const expanded = ref(true)

onMounted(() => {
  expanded.value = window.innerWidth >= 768
})
</script>

<template>
  <div
    class="absolute bottom-20 right-4 z-[1001] pointer-events-auto"
    style="background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);"
    :class="expanded ? 'rounded-lg shadow-md p-3 min-w-[160px]' : 'rounded-full shadow-md w-9 h-9 flex items-center justify-center'"
  >
    <!-- Bouton toggle (i) -->
    <button
      v-if="!expanded"
      class="text-gray-500 hover:text-gray-800 font-bold text-sm transition"
      @click="expanded = true"
      title="Légende"
    >i</button>

    <template v-else>
      <!-- Header légende -->
      <div class="flex items-center justify-between mb-2">
        <p class="text-gray-400 text-[10px] uppercase tracking-widest font-semibold">Participation</p>
        <button
          class="text-gray-400 hover:text-gray-700 text-xs font-bold ml-3 transition"
          @click="expanded = false"
          title="Replier"
        >i</button>
      </div>

      <!-- Entrées -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <span class="text-gray-700 text-xs">Forte (100+)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span class="text-gray-700 text-xs">Modérée (1–99)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
          <span class="text-gray-700 text-xs">Aucun répondant</span>
        </div>
      </div>
      <p class="text-gray-400 text-[10px] mt-2">taille ∝ nb répondants</p>
    </template>
  </div>
</template>
