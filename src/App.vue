<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppNav from '@/components/common/AppNav.vue'

const route = useRoute()
// La vue Story est plein écran — pas de nav ni footer
const isStory = computed(() => route.name === 'survey-story')
</script>

<template>
  <div class="h-dvh flex flex-col overflow-hidden">
    <!-- Zone principale — prend tout l'espace au-dessus de la bottom nav -->
    <main
      class="flex-1 overflow-hidden"
      :class="isStory ? '' : 'pb-[57px]'"
    >
      <RouterView class="w-full h-full" />
    </main>

    <!-- Bottom nav — masquée pendant les Stories -->
    <AppNav v-if="!isStory" />
  </div>
</template>
