<script setup lang="ts">
import { onMounted } from 'vue'
import { useNewsStore } from '@/stores/news'
import { useCommune } from '@/composables/useCommune'
import type { NewsCategory } from '@/types'
import { formatDate } from '@/lib/utils'
import { RouterLink } from 'vue-router'

const newsStore = useNewsStore()
const { communes } = useCommune()

const categories: { value: NewsCategory | null; label: string }[] = [
  { value: null, label: 'Toutes' },
  { value: 'politique', label: 'Politique' },
  { value: 'environnement', label: 'Environnement' },
  { value: 'culture', label: 'Culture' },
  { value: 'sport', label: 'Sport' },
  { value: 'économie', label: 'Économie' },
  { value: 'social', label: 'Social' },
  { value: 'sécurité', label: 'Sécurité' },
]

onMounted(() => newsStore.loadArticles())
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">📰 Actualités</h1>

    <!-- Filtres -->
    <div class="flex flex-wrap gap-3 mb-6">
      <select
        class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
        :value="newsStore.selectedCommune"
        @change="newsStore.setCommune(($event.target as HTMLSelectElement).value || null)"
      >
        <option value="">Toute la Guadeloupe</option>
        <option v-for="c in communes" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>

      <div class="flex gap-1 flex-wrap">
        <button
          v-for="cat in categories"
          :key="String(cat.value)"
          class="px-3 py-1 rounded-full text-xs font-medium border transition"
          :class="newsStore.selectedCategory === cat.value
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'"
          @click="newsStore.setCategory(cat.value)"
        >
          {{ cat.label }}
        </button>
      </div>
    </div>

    <!-- État chargement -->
    <div v-if="newsStore.loading" class="grid md:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="bg-gray-100 rounded-xl h-48 animate-pulse" />
    </div>

    <!-- Grille articles -->
    <div v-else-if="newsStore.articles.length" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      <RouterLink
        v-for="article in newsStore.articles"
        :key="article.id"
        :to="`/actualites/${article.slug}`"
        class="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition"
      >
        <img
          v-if="article.image_url"
          :src="article.image_url"
          :alt="article.title"
          class="w-full h-40 object-cover"
        />
        <div v-else class="w-full h-40 bg-emerald-50 flex items-center justify-center text-4xl">
          📰
        </div>
        <div class="p-4">
          <span class="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full capitalize">
            {{ article.category }}
          </span>
          <h2 class="font-semibold mt-2 text-sm leading-snug line-clamp-2">{{ article.title }}</h2>
          <p class="text-xs text-gray-500 mt-2">
            {{ article.commune?.name ?? 'Guadeloupe' }} · {{ formatDate(article.published_at) }}
          </p>
        </div>
      </RouterLink>
    </div>

    <!-- Vide -->
    <div v-else class="text-center py-16 text-gray-500">
      Aucun article pour ces filtres.
    </div>
  </div>
</template>
