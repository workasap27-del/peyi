<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 text-center pb-24">
    <div class="text-8xl mb-6 select-none">🗺️</div>
    <h1 class="text-white text-3xl font-black mb-3">Page introuvable</h1>
    <p class="text-gray-400 text-[15px] mb-10">Cette page n'existe pas ou a été déplacée.</p>
    <button
      class="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg transition active:scale-[0.98]"
      @click="router.push('/')"
    >Retour à la carte →</button>
  </div>
</template>
