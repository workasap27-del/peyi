<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Article {
  title: string
  link: string
  pubDate: string
  source: string
  description: string
}

const articles = ref<Article[]>([])
const loading = ref(true)
const error = ref(false)

const PROXY = 'https://api.allorigins.win/get?url='
const FEEDS = [
  { url: 'https://www.guadeloupe.franceantilles.fr/rss.xml', source: 'France-Antilles' },
  { url: 'https://rci.fm/guadeloupe/rss', source: 'RCI Guadeloupe' },
]

async function loadFeed(feedUrl: string, source: string): Promise<Article[]> {
  const res = await fetch(`${PROXY}${encodeURIComponent(feedUrl)}`)
  const json = await res.json()
  const xml = new DOMParser().parseFromString(json.contents, 'text/xml')
  const items = Array.from(xml.querySelectorAll('item')).slice(0, 10)
  return items.map(item => ({
    title: item.querySelector('title')?.textContent ?? '',
    link: item.querySelector('link')?.textContent ?? '',
    pubDate: item.querySelector('pubDate')?.textContent ?? '',
    description: item.querySelector('description')?.textContent?.replace(/<[^>]+>/g, '').slice(0, 120) ?? '',
    source,
  }))
}

onMounted(async () => {
  loading.value = true
  error.value = false
  try {
    const results = await Promise.allSettled(FEEDS.map(f => loadFeed(f.url, f.source)))
    const all: Article[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') all.push(...r.value)
    }
    articles.value = all
      .filter(a => a.title)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 20)
    if (!all.length) error.value = true
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

function formatDate(d: string): string {
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return d }
}
</script>

<template>
  <div class="min-h-dvh max-w-4xl mx-auto px-4 py-8 pb-24">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">📰 Actualités</h1>
      <p class="text-gray-500 text-sm mt-1">
        Dernières nouvelles de Guadeloupe depuis France-Antilles et RCI.
      </p>
    </div>

    <!-- Chargement (skeleton) -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 6" :key="i" class="bg-gray-100 rounded-xl h-24 animate-pulse" />
    </div>

    <!-- Erreur / fallback -->
    <div v-else-if="error" class="text-center py-16">
      <div class="text-4xl mb-4">📡</div>
      <p class="text-gray-500 font-medium">Flux RSS temporairement indisponible</p>
      <p class="text-gray-400 text-sm mt-2">
        Consultez directement
        <a href="https://www.guadeloupe.franceantilles.fr" target="_blank" rel="noopener" class="text-emerald-600 underline">France-Antilles</a>
        ou
        <a href="https://rci.fm/guadeloupe" target="_blank" rel="noopener" class="text-emerald-600 underline">RCI Guadeloupe</a>.
      </p>
    </div>

    <!-- Liste articles -->
    <div v-else class="space-y-4">
      <a
        v-for="(article, i) in articles"
        :key="i"
        :href="article.link"
        target="_blank"
        rel="noopener noreferrer"
        class="block bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition group"
      >
        <div class="flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <!-- Source + date -->
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {{ article.source }}
              </span>
              <span class="text-xs text-gray-400">{{ formatDate(article.pubDate) }}</span>
            </div>
            <!-- Titre -->
            <h2 class="font-semibold text-sm leading-snug group-hover:text-emerald-700 transition line-clamp-2">
              {{ article.title }}
            </h2>
            <!-- Description -->
            <p v-if="article.description" class="text-xs text-gray-500 mt-1 line-clamp-2">
              {{ article.description }}
            </p>
          </div>
          <!-- Arrow -->
          <svg class="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </a>
    </div>
  </div>
</template>
