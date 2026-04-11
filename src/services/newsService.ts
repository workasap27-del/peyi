import { supabase } from './supabase'
import type { NewsArticle, NewsCategory } from '@/types'

export interface NewsFilters {
  commune_id?: string
  category?: NewsCategory
  limit?: number
  offset?: number
}

export async function fetchArticles(filters: NewsFilters = {}): Promise<NewsArticle[]> {
  let query = supabase
    .from('news_articles')
    .select('*, commune:communes(id, name, code_insee)')
    .order('published_at', { ascending: false })

  if (filters.commune_id) query = query.eq('commune_id', filters.commune_id)
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.limit) query = query.limit(filters.limit)
  if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1)

  const { data, error } = await query
  if (error) throw error
  return data as NewsArticle[]
}

export async function fetchArticleBySlug(slug: string): Promise<NewsArticle> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*, commune:communes(id, name, code_insee)')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data as NewsArticle
}
