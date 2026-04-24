// ── Communes ─────────────────────────────────────────────────────────────────
export interface Commune {
  id: string
  name: string
  code_insee: string
  department: string
  lat: number
  lng: number
}

// ── Actualités ───────────────────────────────────────────────────────────────
export type NewsCategory =
  | 'politique'
  | 'environnement'
  | 'culture'
  | 'sport'
  | 'économie'
  | 'social'
  | 'sécurité'

export interface NewsArticle {
  id: string
  commune_id: string | null
  commune?: Commune
  title: string
  slug: string
  body: string
  category: NewsCategory
  author: string | null
  published_at: string
  image_url: string | null
  source_url: string | null
  created_at: string
}

// ── Signalements ─────────────────────────────────────────────────────────────
export type ReportCategory =
  | 'voirie'
  | 'eau'
  | 'déchets'
  | 'éclairage'
  | 'végétation'
  | 'autre'

export type ReportStatus =
  | 'ouvert'
  | 'en_cours'
  | 'résolu'
  | 'rejeté'

export interface Report {
  id: string
  user_id: string | null
  commune_id: string
  commune?: Commune
  title: string
  description: string
  category: ReportCategory
  status: ReportStatus
  lat: number
  lng: number
  photos: string[]
  upvotes: number
  created_at: string
  updated_at: string
}

export interface ReportInsert {
  commune_id: string
  title: string
  description: string
  category: ReportCategory
  lat: number
  lng: number
  photos?: string[]
}

// ── Sondages ─────────────────────────────────────────────────────────────────
export type QuestionType = 'single' | 'radio' | 'multiple' | 'scale' | 'text'

export interface SurveyQuestion {
  id: string
  type: QuestionType
  label: string
  options?: string[]
  required?: boolean
  min?: number
  max?: number
}

export interface Survey {
  id: string
  title: string
  description: string | null
  commune_id: string | null
  commune?: Commune
  questions: SurveyQuestion[]
  is_active: boolean
  ends_at: string | null
  created_at: string
  recurrence_type?: 'flash_daily' | 'permanent_quarterly' | 'thematic_monthly' | null
}

export type AgeGroup = '15-24' | '25-34' | '35-49' | '50-64' | '65+'
export type Gender = 'homme' | 'femme' | 'autre' | 'préfère_ne_pas_répondre'
export type EmploymentStatus = 'actif' | 'etudiant' | 'retraite' | 'sans_emploi'

export interface SurveyDemographics {
  age_group?: AgeGroup
  commune?: string
  gender?: Gender
  employment_status?: EmploymentStatus
  sector?: string
  quartier?: string
}

export interface SurveyResponse {
  id: string
  survey_id: string
  respondent_id: string
  answers: Record<string, string | string[] | number>
  demographics: SurveyDemographics
  created_at: string
}

export interface SurveyResponseInsert {
  survey_id: string
  respondent_id: string
  answers: Record<string, string | string[] | number>
  demographics: SurveyDemographics
}
