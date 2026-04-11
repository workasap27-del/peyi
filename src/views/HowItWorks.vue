<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-full bg-gray-950 text-white overflow-y-auto">
    <!-- Header -->
    <div class="px-5 pt-10 pb-6">
      <button class="flex items-center gap-2 text-gray-400 mb-6 text-sm" @click="router.back()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <div class="text-center mb-2">
        <span class="text-4xl">🗺️</span>
      </div>
      <h1 class="text-2xl font-bold text-center">Comment ça marche ?</h1>
      <p class="text-gray-400 text-center text-sm mt-2">
        Péyi connecte les citoyens guadeloupéens à leurs élus grâce à la donnée d'opinion en temps réel.
      </p>
    </div>

    <!-- Steps -->
    <div class="px-5 space-y-5 pb-10">

      <!-- Step 1 -->
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <span class="text-2xl">🗺️</span>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Étape 1</span>
            </div>
            <h2 class="text-lg font-bold mb-2">La carte montre l'opinion de ta commune</h2>
            <p class="text-gray-400 text-sm leading-relaxed">
              Chaque commune de Guadeloupe s'affiche avec une couleur qui reflète l'état d'esprit de ses habitants : <span class="text-emerald-400 font-medium">vert = calme</span>, <span class="text-amber-400 font-medium">orange = préoccupations</span>, <span class="text-red-400 font-medium">rouge = situation critique</span>.
            </p>
            <p class="text-gray-500 text-sm mt-2 leading-relaxed">
              Les bulles proportionnelles montrent le nombre de citoyens ayant participé. Plus la commune est active, plus ses données pèsent dans les rapports transmis aux collectivités.
            </p>
          </div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <span class="text-2xl">📲</span>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold text-blue-400 uppercase tracking-wider">Étape 2</span>
            </div>
            <h2 class="text-lg font-bold mb-2">Tu réponds en 2 minutes, une question à la fois</h2>
            <p class="text-gray-400 text-sm leading-relaxed">
              L'expérience sondage est pensée comme des Stories : plein écran, une question par slide, tu swipes ou tu tapes. Pas de formulaire interminable.
            </p>
            <div class="mt-3 space-y-2">
              <div class="flex items-center gap-2 text-sm text-gray-400">
                <span class="text-emerald-400">✓</span> Anonymat garanti — ton numéro est haché
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-400">
                <span class="text-emerald-400">✓</span> Un seul vote par sondage par personne
              </div>
              <div class="flex items-center gap-2 text-sm text-gray-400">
                <span class="text-emerald-400">✓</span> Résultats visibles immédiatement après
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <span class="text-2xl">🏛️</span>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Étape 3</span>
            </div>
            <h2 class="text-lg font-bold mb-2">Tes élus voient les résultats et agissent</h2>
            <p class="text-gray-400 text-sm leading-relaxed">
              Péyi vend des tableaux de bord d'opinion segmentés aux collectivités locales — communes, Région, Département. Chaque élu peut filtrer par âge, genre, quartier et suivre l'évolution en temps réel.
            </p>
            <p class="text-gray-500 text-sm mt-2 leading-relaxed">
              Plus tu participes, plus ta voix compte dans les décisions qui concernent ton quotidien : eau, routes, emploi, culture.
            </p>
          </div>
        </div>
      </div>

      <!-- Business model transparency -->
      <div class="bg-gray-900/50 rounded-2xl p-5 border border-gray-800/50">
        <h3 class="text-sm font-semibold text-gray-300 mb-2">Pourquoi c'est gratuit pour toi ?</h3>
        <p class="text-xs text-gray-500 leading-relaxed">
          Péyi est financé par les collectivités qui achètent l'accès aux données agrégées et anonymisées. Tu ne pais rien. Tes données personnelles ne sont jamais revendues à des tiers privés.
        </p>
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
