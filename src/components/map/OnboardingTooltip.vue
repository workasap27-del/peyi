<script setup lang="ts">
import { ref, onMounted } from 'vue'

const visible = ref(false)

onMounted(() => {
  if (!localStorage.getItem('peyi_onboarded')) {
    visible.value = true
    setTimeout(dismiss, 4000)
  }
})

function dismiss() {
  visible.value = false
  localStorage.setItem('peyi_onboarded', 'true')
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="visible"
      class="absolute inset-0 z-[1500] flex items-center justify-center pointer-events-auto"
      @click="dismiss"
    >
      <div class="bg-gray-900/90 backdrop-blur-sm text-white px-6 py-5 rounded-2xl text-center shadow-2xl max-w-xs mx-4 border border-white/10">
        <div class="text-4xl mb-3 animate-bounce">👆</div>
        <p class="font-bold text-base mb-1">Appuyez sur votre commune</p>
        <p class="text-sm text-gray-400">pour voir les sondages et participer</p>
        <p class="text-xs text-gray-600 mt-3">Appuyez n'importe où pour continuer</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
