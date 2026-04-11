<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-full bg-white overflow-y-auto">
    <div class="px-5 pt-10 pb-16 max-w-2xl mx-auto">
      <button class="flex items-center gap-2 text-gray-400 mb-6 text-sm" @click="router.back()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <h1 class="text-2xl font-bold text-gray-900 mb-1">Mentions légales</h1>
      <p class="text-sm text-gray-400 mb-8">Dernière mise à jour : avril 2026</p>

      <div class="space-y-8 text-sm text-gray-700 leading-relaxed">

        <section>
          <h2 class="font-bold text-gray-900 text-base mb-3">1. Éditeur responsable</h2>
          <p><strong>Nom :</strong> Mickael BLANCHEDENT</p>
          <p class="mt-1"><strong>Projet :</strong> Péyi — Plateforme Civic Tech Guadeloupe</p>
          <p class="mt-1"><strong>Contact :</strong> contact@peyi.fr</p>
        </section>

        <section>
          <h2 class="font-bold text-gray-900 text-base mb-3">2. Hébergeur</h2>
          <p><strong>Vercel Inc.</strong></p>
          <p class="mt-1">340 Pine Street, Suite 701</p>
          <p>San Francisco, CA 94104, États-Unis</p>
          <p class="mt-1"><a href="https://vercel.com" class="text-emerald-600 underline">vercel.com</a></p>
        </section>

        <section>
          <h2 class="font-bold text-gray-900 text-base mb-3">3. Données collectées</h2>
          <div class="space-y-3">
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="font-semibold text-gray-800">Numéro de téléphone (haché)</p>
              <p class="text-gray-500 mt-1">Ton numéro est transformé en empreinte numérique irréversible. Il n'est jamais stocké en clair ni transmis à des tiers. Il sert uniquement à garantir l'unicité de ton vote.</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="font-semibold text-gray-800">Réponses aux sondages (anonymisées)</p>
              <p class="text-gray-500 mt-1">Tes réponses sont agrégées avec celles d'autres participants. Aucune réponse individuelle n'est accessible par les collectivités abonnées.</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="font-semibold text-gray-800">Données démographiques (facultatives)</p>
              <p class="text-gray-500 mt-1">Groupe d'âge, commune de résidence, genre. Ces informations sont optionnelles et permettent des analyses segmentées. Elles ne permettent pas de t'identifier individuellement.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 class="font-bold text-gray-900 text-base mb-3">4. Base légale du traitement</h2>
          <p><strong>Intérêt légitime</strong> (Art. 6.1.f RGPD) — amélioration de la représentation citoyenne et production de statistiques d'opinion à destination des collectivités locales de Guadeloupe.</p>
        </section>

        <section>
          <h2 class="font-bold text-gray-900 text-base mb-3">5. Durée de conservation</h2>
          <p>Les données sont conservées <strong>3 ans</strong> à compter de leur collecte, puis supprimées automatiquement.</p>
        </section>

        <section>
          <h2 class="font-bold text-gray-900 text-base mb-3">6. Tes droits</h2>
          <p>Conformément au RGPD, tu disposes d'un droit d'accès, de rectification et de suppression de tes données.</p>
          <p class="mt-2">Pour exercer ces droits ou demander la suppression de tes données, envoie un email à :</p>
          <a href="mailto:privacy@peyi.fr" class="inline-block mt-2 text-emerald-600 font-semibold underline">privacy@peyi.fr</a>
          <p class="text-gray-400 mt-2">Nous nous engageons à répondre dans un délai de 30 jours.</p>
        </section>

        <section>
          <h2 class="font-bold text-gray-900 text-base mb-3">7. Cookies</h2>
          <p>Péyi utilise uniquement des cookies techniques strictement nécessaires au fonctionnement de l'application (session d'authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>
        </section>

      </div>
    </div>
  </div>
</template>
