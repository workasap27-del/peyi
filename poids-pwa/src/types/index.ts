export type Sex = 'homme' | 'femme'

export type ActivityLevel =
  | 'sedentaire'
  | 'leger'
  | 'modere'
  | 'actif'
  | 'tres_actif'

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentaire: 'Sédentaire (peu ou pas d\'exercice)',
  leger: 'Légèrement actif (1-3 j/semaine)',
  modere: 'Modérément actif (3-5 j/semaine)',
  actif: 'Actif (6-7 j/semaine)',
  tres_actif: 'Très actif (sport intense, travail physique)',
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
  tres_actif: 1.9,
}

export interface Profile {
  id?: number
  heightCm: number
  startWeightKg: number
  targetWeightKg: number
  age: number
  sex: Sex
  activityLevel: ActivityLevel
  /** Objectif de déficit calorique quotidien théorique (kcal/jour), défaut sain = 500 */
  dailyDeficitTarget: number
  startDate: string // ISO yyyy-mm-dd
  createdAt: string
}

export interface Meal {
  name: string
  calories: number
}

export interface Activity {
  name: string
  calories: number
  durationMin?: number
}

export interface DailyEntry {
  id?: number
  date: string // ISO yyyy-mm-dd, unique
  weightKg?: number
  caloriesIn?: number
  meals: Meal[]
  activitiesOut: Activity[]
  updatedAt: string
}

export interface TrajectoryPoint {
  date: string
  theoreticalWeight?: number
  realWeight?: number
}

export interface ProjectionResult {
  /** Poids actuel estimé (dernier relevé réel, ou projection via bilan calorique) */
  currentWeight: number
  currentWeightIsEstimate: boolean
  daysElapsed: number
  cumulativeRealDeficit: number
  cumulativeTheoreticalDeficit: number
  avgDailyDeficit: number
  daysRemaining: number | null
  projectedDate: string | null
  onTrack: boolean
  theoreticalDate: string
}
