<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-dvh bg-white pb-24">

    <!-- Header -->
    <div class="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 z-10">
      <button class="text-gray-500 hover:text-gray-800 text-sm transition" @click="router.back()">← Retour</button>
      <span class="text-gray-300">|</span>
      <span class="text-sm font-medium text-gray-700">Mentions légales</span>
    </div>

    <div class="max-w-2xl mx-auto px-5 pt-8 pb-16 space-y-8 text-[15px]">

      <h1 class="text-2xl font-bold text-gray-900">Mentions légales</h1>

      <!-- Section 1 — Éditeur -->
      <section>
        <h2 class="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">1. Éditeur du site</h2>
        <dl class="space-y-2 text-gray-700">
          <div class="flex gap-2"><dt class="font-semibold text-gray-500 w-36 shrink-0">Nom :</dt><dd>NOM PRÉNOM — À COMPLÉTER OBLIGATOIREMENT, requis par la loi LCEN</dd></div>
          <div class="flex gap-2"><dt class="font-semibold text-gray-500 w-36 shrink-0">Adresse :</dt><dd>ADRESSE DE DOMICILIATION — À COMPLÉTER</dd></div>
          <div class="flex gap-2"><dt class="font-semibold text-gray-500 w-36 shrink-0">Email :</dt><dd><a href="mailto:contact@peyi.fr" class="text-emerald-600 underline">contact@peyi.fr</a></dd></div>
          <div class="flex gap-2"><dt class="font-semibold text-gray-500 w-36 shrink-0">Forme juridique :</dt><dd>SASU / EI — À COMPLÉTER</dd></div>
        </dl>
        <p class="mt-3 text-gray-400 text-sm italic">
          L'identité de l'éditeur est requise par la loi n°2004-575 (LCEN). Ces informations doivent être complétées avant toute diffusion publique.
        </p>
      </section>

      <!-- Section 2 — Hébergement -->
      <section>
        <h2 class="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">2. Hébergement</h2>
        <p class="text-gray-700">
          Ce site est hébergé par <strong>Vercel Inc.</strong>, 340 Pine Street Suite 900, San Francisco CA 94104, États-Unis.<br>
          <a href="https://vercel.com" target="_blank" rel="noopener" class="text-emerald-600 underline">vercel.com</a>
        </p>
      </section>

      <!-- Section 3 — Propriété intellectuelle -->
      <section>
        <h2 class="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">3. Propriété intellectuelle</h2>
        <p class="text-gray-700 leading-relaxed">
          La marque Péyi, le contenu éditorial et le code source sont la propriété exclusive de l'éditeur.
          Toute reproduction partielle ou totale sans autorisation écrite préalable est interdite.
        </p>
      </section>

      <!-- Section 4 — Données personnelles -->
      <section>
        <h2 class="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">4. Données personnelles</h2>
        <div class="space-y-3 text-gray-700 leading-relaxed">
          <p><strong>Responsable du traitement :</strong> NOM — À COMPLÉTER</p>
          <p><strong>Données collectées :</strong></p>
          <ul class="list-disc pl-5 space-y-1 text-gray-600">
            <li>Identifiant anonyme navigateur stocké en localStorage, non transmis au serveur</li>
            <li>Réponses aux sondages, anonymisées (aucun lien avec l'identité)</li>
            <li>Démographie facultative : commune, tranche d'âge, genre, situation professionnelle, secteur</li>
            <li>Adresse IP traitée par l'hébergeur Vercel lors des requêtes réseau</li>
          </ul>
          <p><strong>Finalité :</strong> recherche d'opinion citoyenne et aide à la décision publique locale en Guadeloupe.</p>
          <p><strong>Base légale :</strong> intérêt légitime — article 6-1-f du RGPD.</p>
          <p><strong>Durée de conservation :</strong> 3 ans à compter de la collecte.</p>
          <p><strong>Tiers :</strong> aucune donnée vendue ou cédée à des tiers. Aucun cookie publicitaire.</p>
        </div>
      </section>

      <!-- Section 5 — Droits RGPD -->
      <section>
        <h2 class="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">5. Vos droits (RGPD)</h2>
        <p class="text-gray-700 leading-relaxed">
          Conformément au Règlement (UE) 2016/679, vous disposez des droits suivants :
          <strong>accès, rectification, effacement, opposition, portabilité</strong> de vos données.
        </p>
        <p class="text-gray-700 mt-2">
          Pour exercer ces droits : <a href="mailto:privacy@peyi.fr" class="text-emerald-600 underline">privacy@peyi.fr</a> — délai de réponse 30 jours.
        </p>
        <p class="text-gray-700 mt-2">
          Vous disposez également du droit de déposer une réclamation auprès de la
          <a href="https://www.cnil.fr" target="_blank" rel="noopener" class="text-emerald-600 underline">CNIL</a>.
        </p>
      </section>

      <!-- Section 6 — Cookies -->
      <section>
        <h2 class="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">6. Cookies et traceurs</h2>
        <p class="text-gray-700 leading-relaxed">
          Péyi utilise uniquement un <strong>identifiant anonyme local</strong> (localStorage) pour garantir l'unicité du vote.
          Aucun cookie tiers, aucune régie publicitaire, aucun traceur de navigation n'est utilisé.
        </p>
      </section>

      <!-- Section 7 — Contact -->
      <section>
        <h2 class="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">7. Contact</h2>
        <p class="text-gray-700">
          <a href="mailto:contact@peyi.fr" class="text-emerald-600 underline">contact@peyi.fr</a> — réponse sous 48h ouvrées.
        </p>
      </section>

      <!-- Pied de page légal -->
      <p class="text-gray-400 text-xs text-center pt-4 border-t border-gray-100">
        Dernière mise à jour : avril 2026 · Conforme à la loi n°2004-575 du 21 juin 2004 (LCEN) et au Règlement (UE) 2016/679 (RGPD).
      </p>

    </div>
  </div>
</template>
