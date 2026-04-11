<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { NewsArticle } from '@/types'
import { fetchArticleBySlug } from '@/services/newsService'
import { formatDate } from '@/lib/utils'

const props = defineProps<{ slug: string }>()
const router = useRouter()

const article = ref<NewsArticle | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    article.value = await fetchArticleBySlug(props.slug)
  } catch {
    error.value = 'Article introuvable'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8">
    <button class="text-sm text-gray-500 hover:text-gray-800 mb-6 flex items-center gap-1" @click="router.back()">
      ← Retour
    </button>

    <div v-if="loading" class="space-y-4">
      <div class="h-8 bg-gray-100 rounded animate-pulse w-3/4" />
      <div class="h-64 bg-gray-100 rounded-xl animate-pulse" />
      <div class="h-4 bg-gray-100 rounded animate-pulse" />
      <div class="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
    </div>

    <div v-else-if="error" class="text-center py-16 text-red-500">{{ error }}</div>

    <article v-else-if="article">
      <span class="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full capitalize">
        {{ article.category }}
      </span>
      <h1 class="text-2xl md:text-3xl font-bold mt-3 mb-2">{{ article.title }}</h1>
      <p class="text-sm text-gray-500 mb-6">
        {{ article.commune?.name ?? 'Guadeloupe' }}
        <span v-if="article.author"> · {{ article.author }}</span>
        · {{ formatDate(article.published_at) }}
      </p>

      <img
        v-if="article.image_url"
        :src="article.image_url"
        :alt="article.title"
        class="w-full rounded-xl mb-6 max-h-96 object-cover"
      />

      <div class="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
        {{ article.body }}
      </div>

      <a
        v-if="article.source_url"
        :href="article.source_url"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-6 inline-block text-sm text-emerald-700 hover:underline"
      >
        Lire la source originale →
      </a>
    </article>
  </div>
</template>
