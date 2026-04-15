<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppNav from '@/components/common/AppNav.vue'

const route = useRoute()
const isStory = computed(() => route.name === 'survey-story')

// ── PWA install prompt ────────────────────────────────────────────────────────
const showInstallPrompt = ref(false)
let deferredPrompt: any = null

function onBeforeInstall(e: Event) {
  e.preventDefault()
  deferredPrompt = e
  const dismissed = localStorage.getItem('peyi_install_dismissed')
  if (!dismissed) showInstallPrompt.value = true
}

async function installApp() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  await deferredPrompt.userChoice
  deferredPrompt = null
  showInstallPrompt.value = false
}

function dismissInstall() {
  showInstallPrompt.value = false
  localStorage.setItem('peyi_install_dismissed', '1')
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstall)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstall)
})
</script>

<template>
  <div class="h-dvh flex flex-col overflow-hidden">
    <main
      class="flex-1 overflow-y-auto"
      :class="isStory ? '' : 'pb-[57px]'"
    >
      <RouterView class="w-full h-full" />
    </main>

    <AppNav v-if="!isStory" />

    <!-- Toast PWA install -->
    <Transition name="toast">
      <div
        v-if="showInstallPrompt"
        class="fixed bottom-20 left-4 right-4 z-[9999] bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3"
      >
        <span class="text-2xl shrink-0">📲</span>
        <p class="flex-1 text-sm font-medium leading-snug">Installer Péyi sur votre écran d'accueil</p>
        <button
          class="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-3 py-1.5 rounded-xl transition"
          @click="installApp"
        >Installer</button>
        <button
          class="shrink-0 text-gray-400 hover:text-white text-lg leading-none transition"
          @click="dismissInstall"
        >×</button>
      </div>
    </Transition>
  </div>
</template>

<style>
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(16px); }
</style>
