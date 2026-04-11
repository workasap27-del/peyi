<script setup lang="ts">
import { ref } from 'vue'
import CommuneMap from '@/components/map/CommuneMap.vue'
import CommunePanel from '@/components/map/CommunePanel.vue'
import type { CommuneStat } from '@/data/communeStats'

const selectedCommune = ref<CommuneStat | null>(null)

function onSelectCommune(commune: CommuneStat) {
  selectedCommune.value = commune
}
</script>

<template>
  <!-- La carte occupe tout l'écran sous la bottom nav -->
  <div class="w-full h-full">
    <CommuneMap @select-commune="onSelectCommune" />
    <CommunePanel
      :commune="selectedCommune"
      @close="selectedCommune = null"
    />
  </div>
</template>
