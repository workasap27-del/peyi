import type { DailyEntry, Profile, ProjectionResult, TrajectoryPoint } from '../types'
import { ACTIVITY_MULTIPLIERS } from '../types'
import { addDays, diffDays, todayISO } from './date'

/** Équivalence énergétique communément admise pour 1 kg de masse grasse. */
export const KCAL_PER_KG = 7700

/** Formule de Mifflin-St Jeor (métabolisme de base, kcal/jour). */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Profile['sex'],
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'homme' ? base + 5 : base - 161
}

export function calculateTDEE(bmr: number, activityLevel: Profile['activityLevel']): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel]
}

/** Nombre de jours théoriques pour atteindre l'objectif au rythme du déficit cible. */
export function theoreticalDaysToGoal(profile: Profile): number {
  const kgToLose = profile.startWeightKg - profile.targetWeightKg
  if (kgToLose <= 0 || profile.dailyDeficitTarget <= 0) return 0
  return Math.ceil((kgToLose * KCAL_PER_KG) / profile.dailyDeficitTarget)
}

export function theoreticalGoalDate(profile: Profile): string {
  return addDays(profile.startDate, theoreticalDaysToGoal(profile))
}

/** Courbe théorique : perte linéaire au rythme du déficit cible quotidien. */
export function buildTheoreticalTrajectory(profile: Profile): TrajectoryPoint[] {
  const totalDays = theoreticalDaysToGoal(profile)
  const kgToLose = profile.startWeightKg - profile.targetWeightKg
  const points: TrajectoryPoint[] = []
  const step = Math.max(1, Math.round(totalDays / 24)) // ~24 points max sur le graphique
  for (let day = 0; day <= totalDays; day += step) {
    const weight = profile.startWeightKg - (kgToLose * day) / totalDays
    points.push({ date: addDays(profile.startDate, day), theoreticalWeight: weight })
  }
  if (totalDays > 0 && (points.length === 0 || points[points.length - 1].date !== theoreticalGoalDate(profile))) {
    points.push({ date: theoreticalGoalDate(profile), theoreticalWeight: profile.targetWeightKg })
  }
  return points
}

/**
 * Déficit calorique réel d'une journée = dépense (TDEE au poids estimé du jour + sport)
 * moins apports enregistrés. Retourne `null` si aucun apport n'a été saisi ce jour-là.
 */
function dailyRealDeficit(profile: Profile, entry: DailyEntry, weightForDay: number): number | null {
  if (entry.caloriesIn == null) return null
  const bmr = calculateBMR(weightForDay, profile.heightCm, profile.age, profile.sex)
  const tdee = calculateTDEE(bmr, profile.activityLevel)
  const extraBurn = entry.activitiesOut.reduce((sum, a) => sum + a.calories, 0)
  return tdee + extraBurn - entry.caloriesIn
}

/**
 * Construit la courbe réelle : pesées effectives, et entre deux pesées, estimation du poids
 * via le bilan calorique cumulé depuis le dernier point d'ancrage connu.
 */
export function buildRealTrajectory(profile: Profile, entries: DailyEntry[]): TrajectoryPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const points: TrajectoryPoint[] = []

  let anchorWeight = profile.startWeightKg
  let anchorDate = profile.startDate
  let cumulativeSinceAnchor = 0

  const today = todayISO()
  const lastDate = sorted.length > 0 ? sorted[sorted.length - 1].date : profile.startDate
  const endDate = lastDate > today ? lastDate : today

  const entryByDate = new Map(sorted.map((e) => [e.date, e]))
  const totalSpan = Math.max(1, diffDays(profile.startDate, endDate))

  for (let day = 0; day <= totalSpan; day++) {
    const date = addDays(profile.startDate, day)
    const entry = entryByDate.get(date)

    if (entry?.weightKg != null) {
      anchorWeight = entry.weightKg
      anchorDate = date
      cumulativeSinceAnchor = 0
      points.push({ date, realWeight: anchorWeight })
      continue
    }

    if (entry) {
      const estimateBase = points.length > 0 ? points[points.length - 1].realWeight! : anchorWeight
      const deficit = dailyRealDeficit(profile, entry, estimateBase)
      if (deficit != null) cumulativeSinceAnchor += deficit
    }

    if (date === anchorDate) continue
    const estimatedWeight = anchorWeight - cumulativeSinceAnchor / KCAL_PER_KG
    points.push({ date, realWeight: estimatedWeight })
  }

  return points
}

/**
 * Cœur du moteur adaptatif : compare le rythme réel de déficit au rythme théorique
 * et recalcule la date prévisionnelle d'atteinte de l'objectif.
 */
export function computeProjection(profile: Profile, entries: DailyEntry[]): ProjectionResult {
  const today = todayISO()
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  let cumulativeRealDeficit = 0
  let daysLogged = 0
  let latestActualWeight: number | null = null
  let latestActualDate: string | null = null
  let runningWeight = profile.startWeightKg

  for (const entry of sorted) {
    if (entry.weightKg != null) {
      latestActualWeight = entry.weightKg
      latestActualDate = entry.date
      runningWeight = entry.weightKg
    }
    const deficit = dailyRealDeficit(profile, entry, runningWeight)
    if (deficit != null) {
      cumulativeRealDeficit += deficit
      daysLogged += 1
      runningWeight -= deficit / KCAL_PER_KG
    }
  }

  const currentWeightIsEstimate = latestActualDate !== today
  const currentWeight =
    latestActualWeight != null && !currentWeightIsEstimate
      ? latestActualWeight
      : daysLogged > 0
        ? profile.startWeightKg - cumulativeRealDeficit / KCAL_PER_KG
        : (latestActualWeight ?? profile.startWeightKg)

  const daysElapsed = Math.max(0, diffDays(profile.startDate, today))
  const cumulativeTheoreticalDeficit = profile.dailyDeficitTarget * daysElapsed
  const avgDailyDeficit = daysLogged > 0 ? cumulativeRealDeficit / daysLogged : profile.dailyDeficitTarget

  const remainingKg = currentWeight - profile.targetWeightKg
  let daysRemaining: number | null = null
  let projectedDate: string | null = null

  if (remainingKg <= 0) {
    daysRemaining = 0
    projectedDate = today
  } else if (avgDailyDeficit > 0) {
    daysRemaining = (remainingKg * KCAL_PER_KG) / avgDailyDeficit
    projectedDate = addDays(today, Math.ceil(daysRemaining))
  }

  const theoreticalDate = theoreticalGoalDate(profile)
  const onTrack = projectedDate != null && projectedDate <= theoreticalDate

  return {
    currentWeight,
    currentWeightIsEstimate,
    daysElapsed,
    cumulativeRealDeficit,
    cumulativeTheoreticalDeficit,
    avgDailyDeficit,
    daysRemaining,
    projectedDate,
    onTrack,
    theoreticalDate,
  }
}
