<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const menuOpen = ref(false)

const tabs = [
  { name: 'Carte',      to: '/',            icon: '🗺️' },
  { name: 'Sondages',   to: '/sondages',    icon: '📊' },
]
</script>

<template>
  <!-- Bottom nav principale (mobile-first) -->
  <nav class="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 safe-area-inset-bottom">
    <div class="flex">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors"
        :class="route.path === tab.to || (tab.to !== '/' && route.path.startsWith(tab.to))
          ? 'text-emerald-700'
          : 'text-gray-400 hover:text-gray-600'"
      >
        <span class="text-xl leading-none">{{ tab.icon }}</span>
        <span class="text-[10px] font-medium">{{ tab.name }}</span>
      </RouterLink>

      <!-- Bouton menu secondaire -->
      <button
        class="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors"
        :class="menuOpen ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'"
        @click="menuOpen = !menuOpen"
      >
        <span class="text-xl leading-none">☰</span>
        <span class="text-[10px] font-medium">Plus</span>
      </button>
    </div>
  </nav>

  <!-- Menu slide-up secondaire -->
  <Transition name="menu">
    <div
      v-if="menuOpen"
      class="fixed inset-x-0 bottom-[57px] z-[9000] bg-white rounded-t-2xl shadow-2xl border-t border-gray-100 px-4 py-5 pointer-events-auto"
      style="max-height: 50vh;"
    >
      <div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
      <p class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Navigation</p>

      <div class="space-y-1">
        <RouterLink
          to="/comment-ca-marche"
          class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition"
          @click="menuOpen = false"
        >
          <span class="text-2xl">💡</span>
          <div>
            <p class="font-medium text-sm">Comment ça marche ?</p>
            <p class="text-xs text-gray-400">La vision et le fonctionnement de Péyi</p>
          </div>
        </RouterLink>
        <RouterLink
          to="/mentions-legales"
          class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition"
          @click="menuOpen = false"
        >
          <span class="text-2xl">📄</span>
          <div>
            <p class="font-medium text-sm">Mentions légales</p>
            <p class="text-xs text-gray-400">Données, vie privée, éditeur</p>
          </div>
        </RouterLink>
      </div>
    </div>
  </Transition>

  <!-- Overlay menu -->
  <Transition name="fade">
    <div
      v-if="menuOpen"
      class="fixed inset-0 z-[8999] bg-black/20"
      @click="menuOpen = false"
    />
  </Transition>
</template>

<style scoped>
.menu-enter-active, .menu-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.menu-enter-from, .menu-leave-to {
  transform: translateY(100%);
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
