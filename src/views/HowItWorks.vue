<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-dvh bg-gray-950 text-white">
    <!-- Header -->
    <div class="px-5 pt-10 pb-6">
      <button class="flex items-center gap-2 text-gray-400 mb-6 text-sm" @click="router.back()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <h1 class="text-2xl font-bold text-center">Comment ça marche ?</h1>
      <p class="text-gray-400 text-center text-sm mt-2">
        Péyi connecte les citoyens guadeloupéens à leurs élus grâce à la donnée d'opinion en temps réel.
      </p>
    </div>

    <!-- Steps -->
    <div class="px-5 space-y-5 pb-24">

      <!-- Step 1 -->
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800 step-card" style="animation-delay: 0s;">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <!-- Icône carte avec curseur -->
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              <circle cx="15" cy="13" r="2" fill="currentColor" opacity="0.6" />
            </svg>
          </div>
          <div class="flex-1">
            <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Étape 1</span>
            <h2 class="text-lg font-bold mb-2 mt-1">Explore ta commune</h2>
            <p class="text-gray-400 text-sm leading-relaxed">
              La carte montre en temps réel la participation citoyenne dans chaque commune de Guadeloupe.
            </p>
          </div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800 step-card" style="animation-delay: 0.15s;">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <!-- Icône bulle dialogue avec check -->
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div class="flex-1">
            <span class="text-xs font-bold text-blue-400 uppercase tracking-wider">Étape 2</span>
            <h2 class="text-lg font-bold mb-2 mt-1">Réponds en 2 minutes</h2>
            <p class="text-gray-400 text-sm leading-relaxed">
              Un sondage, quelques questions simples, ton avis compte autant que celui du voisin.
            </p>
          </div>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800 step-card" style="animation-delay: 0.3s;">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <!-- Icône graphique avec étoile -->
            <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M19.5 6.5l-1 2.5-2.5.5 1.8 1.7-.4 2.5 2.1-1.2 2.1 1.2-.4-2.5 1.8-1.7-2.5-.5z" fill="currentColor" opacity="0.5" />
            </svg>
          </div>
          <div class="flex-1">
            <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Étape 3</span>
            <h2 class="text-lg font-bold mb-2 mt-1">Tes élus voient les résultats</h2>
            <p class="text-gray-400 text-sm leading-relaxed">
              Les données sont transmises aux collectivités pour éclairer leurs décisions.
            </p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <RouterLink
        to="/"
        class="block w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-center text-base transition hover:bg-emerald-700 active:scale-[0.98]"
      >
        Voir la carte →
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-card {
  animation: slideUp 0.5s ease forwards;
  opacity: 0;
}
</style>
