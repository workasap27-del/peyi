<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCommunesStore } from '@/stores/communes'

const communesStore = useCommunesStore()
const expanded = ref(true)

onMounted(() => {
  expanded.value = window.innerWidth >= 768
})
</script>

<template>
  <div
    class="absolute bottom-20 right-4 z-[1001] pointer-events-auto"
    style="background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);"
    :class="expanded ? 'rounded-lg shadow-md p-2.5 w-[162px]' : 'rounded-full shadow-md w-9 h-9 flex items-center justify-center'"
  >
    <button
      v-if="!expanded"
      class="text-gray-500 hover:text-gray-800 font-bold text-sm transition"
      title="Légende"
      @click="expanded = true"
    >i</button>

    <template v-else>
      <div class="flex items-center justify-between mb-2">
        <p class="text-gray-400 text-[10px] uppercase tracking-widest font-semibold">Participation</p>
        <button
          class="text-gray-400 hover:text-gray-700 text-xs font-bold ml-3 transition"
          title="Replier"
          @click="expanded = false"
        >i</button>
      </div>

      <div class="space-y-1.5">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <span class="text-gray-700 text-xs">Forte participation</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span class="text-gray-700 text-xs">Modérée</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
          <span class="text-gray-700 text-xs">Aucune</span>
        </div>
      </div>

      <p class="text-gray-400 text-[10px] mt-2">taille ∝ nb répondants</p>

      <!-- Note dynamique maxCount -->
      <p v-if="communesStore.maxCount > 0" class="text-gray-400 text-[10px] mt-1">
        Max actuel : {{ communesStore.maxCount }} répondants
      </p>
      <p v-else class="text-gray-400 text-[10px] mt-1">
        Soyez le premier à répondre 🌱
      </p>
    </template>
  </div>
</template>
