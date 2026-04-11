import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { NewsArticle, NewsCategory } from '@/types'
import { fetchArticles } from '@/services/newsService'

export const useNewsStore = defineStore('news', () => {
  const articles = ref<NewsArticle[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedCommune = ref<string | null>(null)
  const selectedCategory = ref<NewsCategory | null>(null)

  async function loadArticles() {
    loading.value = true
    error.value = null
    try {
      articles.value = await fetchArticles({
        commune_id: selectedCommune.value ?? undefined,
        category: selectedCategory.value ?? undefined,
        limit: 24,
      })
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  function setCommune(id: string | null) {
    selectedCommune.value = id
    loadArticles()
  }

  function setCategory(cat: NewsCategory | null) {
    selectedCategory.value = cat
    loadArticles()
  }

  return { articles, loading, error, selectedCommune, selectedCategory, loadArticles, setCommune, setCategory }
})
