import { supabase } from './supabase'
import type { Report, ReportCategory, ReportStatus, ReportInsert } from '@/types'

export interface ReportFilters {
  commune_id?: string
  category?: ReportCategory
  status?: ReportStatus
}

export async function fetchReports(filters: ReportFilters = {}): Promise<Report[]> {
  let query = supabase
    .from('reports')
    .select('*, commune:communes(id, name, code_insee)')
    .order('created_at', { ascending: false })

  if (filters.commune_id) query = query.eq('commune_id', filters.commune_id)
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return data as Report[]
}

export async function fetchReportById(id: string): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, commune:communes(id, name, code_insee)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Report
}

export async function createReport(payload: ReportInsert): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as Report
}

export async function upvoteReport(id: string): Promise<void> {
  const { error } = await supabase.rpc('increment_report_upvotes', { report_id: id })
  if (error) throw error
}
