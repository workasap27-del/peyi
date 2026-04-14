<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-dvh bg-white">
    <div class="px-5 pt-10 pb-24 max-w-2xl mx-auto">
      <button class="flex items-center gap-2 text-gray-400 mb-6 text-sm" @click="router.back()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <h1 class="text-2xl font-bold text-gray-900 mb-1">Mentions légales</h1>
      <p class="text-sm text-gray-400 mb-8">Dernière mise à jour : avril 2026</p>

      <div class="space-y-8 text-sm text-gray-700 leading-relaxed divide-y divide-gray-100">

        <section class="pt-4 first:pt-0">
          <h2 class="font-bold text-gray-900 text-base mb-3">1. Éditeur</h2>
          <p><strong>Nom :</strong> Mickael BLANCHEDENT</p>
          <p class="mt-1"><strong>Adresse :</strong> Évreux (27000), France</p>
          <p class="mt-1"><strong>Contact :</strong> <a href="mailto:contact@peyi.fr" class="text-emerald-600 underline">contact@peyi.fr</a></p>
        </section>

        <section class="pt-6">
          <h2 class="font-bold text-gray-900 text-base mb-3">2. Hébergement</h2>
          <p><strong>Vercel Inc.</strong></p>
          <p class="mt-1">340 Pine Street, Suite 900</p>
          <p>San Francisco, CA 94104, USA</p>
          <p class="mt-1"><a href="https://vercel.com" target="_blank" rel="noopener" class="text-emerald-600 underline">vercel.com</a></p>
        </section>

        <section class="pt-6">
          <h2 class="font-bold text-gray-900 text-base mb-3">3. Données personnelles</h2>
          <p><strong>Responsable du traitement :</strong> Mickael BLANCHEDENT</p>

          <div class="mt-4 space-y-3">
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="font-semibold text-gray-800">Données collectées</p>
              <ul class="text-gray-500 mt-1 space-y-1 list-disc list-inside text-xs">
                <li>Identifiant anonyme local (stocké uniquement dans votre navigateur, non transmis au serveur)</li>
                <li>Réponses anonymisées aux sondages</li>
                <li>Démographie facultative : groupe d'âge, genre</li>
                <li>Adresse IP traitée par les serveurs Vercel</li>
              </ul>
            </div>
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="font-semibold text-gray-800">Finalité</p>
              <p class="text-gray-500 mt-1 text-xs">Amélioration des politiques publiques locales et recherche d'opinion citoyenne en Guadeloupe.</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="font-semibold text-gray-800">Base légale</p>
              <p class="text-gray-500 mt-1 text-xs">Intérêt légitime (art. 6-1-f RGPD)</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="font-semibold text-gray-800">Durée de conservation</p>
              <p class="text-gray-500 mt-1 text-xs">3 ans à compter de la collecte, puis suppression automatique.</p>
            </div>
          </div>
        </section>

        <section class="pt-6">
          <h2 class="font-bold text-gray-900 text-base mb-3">4. Vos droits</h2>
          <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition et de portabilité de vos données.</p>
          <p class="mt-2">Pour exercer ces droits :</p>
          <a href="mailto:privacy@peyi.fr" class="inline-block mt-2 text-emerald-600 font-semibold underline">privacy@peyi.fr</a>
          <p class="text-gray-400 mt-2 text-xs">Réponse sous 30 jours.</p>
        </section>

        <section class="pt-6">
          <h2 class="font-bold text-gray-900 text-base mb-3">5. Cookies et traceurs</h2>
          <p>Péyi n'utilise <strong>aucun cookie tiers</strong> ni traceur publicitaire.</p>
          <p class="mt-2">Seul un identifiant anonyme local est stocké dans le <code class="bg-gray-100 px-1 rounded text-xs">localStorage</code> de votre navigateur afin de garantir l'unicité de votre vote. Cet identifiant ne quitte jamais votre appareil.</p>
        </section>

        <section class="pt-6">
          <h2 class="font-bold text-gray-900 text-base mb-3">6. Contact DPO</h2>
          <a href="mailto:privacy@peyi.fr" class="text-emerald-600 font-semibold underline">privacy@peyi.fr</a>
        </section>

      </div>
    </div>
  </div>
</template>
