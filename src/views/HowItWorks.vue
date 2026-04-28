<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-dvh bg-gray-950 flex flex-col pb-24">

    <!-- Header -->
    <div class="px-6 pt-10 pb-6">
      <h1 class="text-white text-3xl font-black leading-tight">Comment<br>ça marche ?</h1>
      <p class="text-gray-400 text-[15px] mt-2">Simple. Anonyme. Utile.</p>
    </div>

    <!-- Étapes -->
    <div class="flex-1 px-6 space-y-6">

      <!-- Étape 1 -->
      <div class="how-step bg-gray-900 rounded-3xl p-6 border border-gray-800" style="animation-delay: 0ms;">
        <div class="w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-5">
          <svg viewBox="0 0 48 48" class="w-9 h-9" fill="none">
            <rect x="6" y="10" width="36" height="26" rx="4" fill="#10b981" opacity="0.2"/>
            <rect x="6" y="10" width="36" height="26" rx="4" stroke="#10b981" stroke-width="2"/>
            <rect x="10" y="14" width="14" height="10" rx="2" fill="#10b981" opacity="0.5"/>
            <rect x="26" y="14" width="12" height="10" rx="2" fill="#34d399" opacity="0.4"/>
            <rect x="10" y="27" width="10" height="6" rx="2" fill="#6ee7b7" opacity="0.4"/>
            <rect x="22" y="27" width="16" height="6" rx="2" fill="#10b981" opacity="0.3"/>
            <g class="cursor-anim">
              <circle cx="28" cy="20" r="3" fill="#10b981"/>
              <circle cx="28" cy="20" r="6" fill="#10b981" opacity="0.2"/>
            </g>
          </svg>
        </div>
        <span class="text-emerald-400 text-xs font-bold uppercase tracking-widest">Étape 1</span>
        <h2 class="text-white text-xl font-black mt-1 mb-2">Ta commune sur la carte</h2>
        <p class="text-gray-400 text-[15px] leading-relaxed">
          Vois en temps réel ce que pensent tes voisins, quartier par quartier. La carte s'anime avec chaque nouvelle voix.
        </p>
      </div>

      <!-- Étape 2 -->
      <div class="how-step bg-gray-900 rounded-3xl p-6 border border-gray-800" style="animation-delay: 120ms;">
        <div class="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center mb-5">
          <svg viewBox="0 0 48 48" class="w-9 h-9" fill="none">
            <path d="M8 10C8 7.8 9.8 6 12 6H36C38.2 6 40 7.8 40 10V28C40 30.2 38.2 32 36 32H20L12 42V32H12C9.8 32 8 30.2 8 28V10Z" fill="#3b82f6" opacity="0.15" stroke="#3b82f6" stroke-width="2"/>
            <circle cx="17" cy="19" r="2.5" fill="#60a5fa"/>
            <circle cx="24" cy="19" r="2.5" fill="#3b82f6"/>
            <circle cx="31" cy="19" r="2.5" fill="#93c5fd"/>
          </svg>
        </div>
        <span class="text-blue-400 text-xs font-bold uppercase tracking-widest">Étape 2</span>
        <h2 class="text-white text-xl font-black mt-1 mb-2">Ton avis en 2 minutes</h2>
        <p class="text-gray-400 text-[15px] leading-relaxed">
          Une question, un tap. Anonyme, sans inscription, sans jugement. Tu peux t'arrêter quand tu veux.
        </p>
      </div>

      <!-- Étape 3 -->
      <div class="how-step bg-gray-900 rounded-3xl p-6 border border-gray-800" style="animation-delay: 240ms;">
        <div class="w-16 h-16 rounded-2xl bg-orange-500/15 flex items-center justify-center mb-5">
          <svg viewBox="0 0 48 48" class="w-9 h-9" fill="none">
            <path d="M24 6L27.5 17H39L29.5 23.5L33 34.5L24 28L15 34.5L18.5 23.5L9 17H20.5L24 6Z" fill="#f97316" opacity="0.8"/>
            <circle cx="24" cy="42" r="2" fill="#fb923c" opacity="0.4"/>
            <circle cx="8" cy="22" r="1.5" fill="#fdba74" opacity="0.4"/>
            <circle cx="40" cy="22" r="1.5" fill="#fdba74" opacity="0.4"/>
          </svg>
        </div>
        <span class="text-orange-400 text-xs font-bold uppercase tracking-widest">Étape 3</span>
        <h2 class="text-white text-xl font-black mt-1 mb-2">Ta voix façonne demain</h2>
        <p class="text-gray-400 text-[15px] leading-relaxed">
          Tes réponses alimentent des données réelles transmises aux décideurs locaux. Ici, chaque avis compte autant que celui du maire.
        </p>
      </div>
    </div>

    <!-- CTA -->
    <div class="px-6 pt-8">
      <button
        class="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg transition active:scale-[0.98]"
        @click="router.push('/')"
      >Découvrir la carte →</button>
      <p class="text-gray-500 text-xs text-center mt-3">100% gratuit · Anonyme · Sans compte</p>
    </div>

  </div>
</template>

<style scoped>
.how-step {
  animation: slideUp 0.5s ease-out both;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.cursor-anim {
  animation: cursorPulse 2s ease-in-out infinite;
  transform-origin: 28px 20px;
}

@keyframes cursorPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.5; }
}
</style>
