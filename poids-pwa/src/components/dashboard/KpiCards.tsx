import type { DailyEntry, Profile, ProjectionResult } from '../../types'
import { formatDateFR } from '../../lib/date'
import { calculateBMR, calculateTDEE } from '../../lib/calculations'
import { Card } from '../ui/Field'

export function KpiCards({
  profile,
  projection,
  todayEntry,
}: {
  profile: Profile
  projection: ProjectionResult
  todayEntry: DailyEntry | undefined
}) {
  const bmr = calculateBMR(projection.currentWeight, profile.heightCm, profile.age, profile.sex)
  const tdee = calculateTDEE(bmr, profile.activityLevel)
  const caloriesIn = todayEntry?.caloriesIn ?? 0
  const caloriesOutExtra = (todayEntry?.activitiesOut ?? []).reduce((s, a) => s + a.calories, 0)
  const todayBalance = tdee + caloriesOutExtra - caloriesIn
  const hasLoggedToday = todayEntry?.caloriesIn != null

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card>
        <p className="text-xs uppercase tracking-wide text-slate-500">Poids</p>
        <p className="mt-1 text-2xl font-bold text-slate-50">
          {projection.currentWeight.toFixed(1)} <span className="text-base font-medium text-slate-400">kg</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {profile.startWeightKg} kg → {profile.targetWeightKg} kg
          {projection.currentWeightIsEstimate && ' · estimé'}
        </p>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-wide text-slate-500">Objectif estimé</p>
        <p className="mt-1 text-xl font-bold text-slate-50">
          {projection.projectedDate ? formatDateFR(projection.projectedDate) : '—'}
        </p>
        <p className={`mt-1 text-xs ${projection.onTrack ? 'text-emerald-400' : 'text-amber-400'}`}>
          {projection.projectedDate
            ? projection.onTrack
              ? 'Dans les temps, voire en avance'
              : 'En retard sur la trajectoire théorique'
            : 'Rythme actuel insuffisant pour atteindre l\'objectif'}
        </p>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-wide text-slate-500">Bilan du jour</p>
        <p className={`mt-1 text-2xl font-bold ${todayBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {todayBalance >= 0 ? '−' : '+'}
          {Math.abs(Math.round(todayBalance))} <span className="text-base font-medium text-slate-400">kcal</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {hasLoggedToday ? `${caloriesIn} kcal ingérées · dépense ${Math.round(tdee + caloriesOutExtra)} kcal` : 'Aucune saisie aujourd\'hui'}
        </p>
      </Card>
    </div>
  )
}
