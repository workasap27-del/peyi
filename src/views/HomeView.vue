<script setup lang="ts">
import { ref } from 'vue'
import CommuneMap from '@/components/map/CommuneMap.vue'
import CommunePanel from '@/components/map/CommunePanel.vue'
import GlobalSurveyButton from '@/components/map/GlobalSurveyButton.vue'
import type { CommuneStat } from '@/data/communeStats'

const selectedCommune = ref<CommuneStat | null>(null)

function onSelectCommune(commune: CommuneStat) {
  selectedCommune.value = commune
}
</script>

<template>
  <!-- La carte occupe tout l'écran sous la bottom nav -->
  <div class="w-full h-full relative">
    <CommuneMap @select-commune="onSelectCommune" />
    <GlobalSurveyButton />
    <CommunePanel
      :commune="selectedCommune"
      @close="selectedCommune = null"
    />
  </div>
</template>
