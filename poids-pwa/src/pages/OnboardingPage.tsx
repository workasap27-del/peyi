import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveProfile } from '../db/db'
import { calculateBMR, calculateTDEE, theoreticalDaysToGoal, theoreticalGoalDate } from '../lib/calculations'
import { formatDateFR, todayISO } from '../lib/date'
import type { ActivityLevel, Profile, Sex } from '../types'
import { ACTIVITY_LABELS } from '../types'
import { Button, Card, Field, Select, TextInput } from '../components/ui/Field'

const defaultActivity: ActivityLevel = 'sedentaire'

export function OnboardingPage() {
  const navigate = useNavigate()
  const [heightCm, setHeightCm] = useState('165')
  const [startWeightKg, setStartWeightKg] = useState('120')
  const [targetWeightKg, setTargetWeightKg] = useState('75')
  const [age, setAge] = useState('35')
  const [sex, setSex] = useState<Sex>('femme')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(defaultActivity)
  const [dailyDeficitTarget, setDailyDeficitTarget] = useState('500')
  const [error, setError] = useState<string | null>(null)

  const h = Number(heightCm)
  const sw = Number(startWeightKg)
  const tw = Number(targetWeightKg)
  const a = Number(age)
  const deficit = Number(dailyDeficitTarget)

  const previewValid = h > 0 && sw > 0 && tw > 0 && a > 0 && deficit > 0 && tw < sw

  let preview: { tdee: number; days: number; date: string } | null = null
  if (previewValid) {
    const bmr = calculateBMR(sw, h, a, sex)
    const tdee = calculateTDEE(bmr, activityLevel)
    const draftProfile: Profile = {
      heightCm: h,
      startWeightKg: sw,
      targetWeightKg: tw,
      age: a,
      sex,
      activityLevel,
      dailyDeficitTarget: deficit,
      startDate: todayISO(),
      createdAt: new Date().toISOString(),
    }
    preview = {
      tdee: Math.round(tdee),
      days: theoreticalDaysToGoal(draftProfile),
      date: theoreticalGoalDate(draftProfile),
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!previewValid) {
      setError('Merci de vérifier les valeurs saisies (le poids cible doit être inférieur au poids de départ).')
      return
    }
    const profile: Profile = {
      heightCm: h,
      startWeightKg: sw,
      targetWeightKg: tw,
      age: a,
      sex,
      activityLevel,
      dailyDeficitTarget: deficit,
      startDate: todayISO(),
      createdAt: new Date().toISOString(),
    }
    await saveProfile(profile)
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 py-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Bienvenue 👋</h1>
        <p className="mt-1 text-sm text-slate-400">
          Renseigne ton profil pour générer ta trajectoire de perte de poids.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Taille (cm)">
          <TextInput type="number" inputMode="decimal" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} required min={100} max={250} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Poids de départ (kg)">
            <TextInput type="number" inputMode="decimal" step="0.1" value={startWeightKg} onChange={(e) => setStartWeightKg(e.target.value)} required min={30} max={400} />
          </Field>
          <Field label="Poids cible (kg)">
            <TextInput type="number" inputMode="decimal" step="0.1" value={targetWeightKg} onChange={(e) => setTargetWeightKg(e.target.value)} required min={30} max={400} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Âge">
            <TextInput type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} required min={14} max={100} />
          </Field>
          <Field label="Sexe">
            <Select value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
              <option value="femme">Femme</option>
              <option value="homme">Homme</option>
            </Select>
          </Field>
        </div>
        <Field label="Niveau d'activité de base">
          <Select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}>
            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
              <option key={level} value={level}>
                {ACTIVITY_LABELS[level]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Déficit calorique quotidien visé (kcal/j)" hint="500 kcal/jour ≈ perte de 0,5 kg/semaine, rythme sain recommandé.">
          <TextInput type="number" inputMode="numeric" value={dailyDeficitTarget} onChange={(e) => setDailyDeficitTarget(e.target.value)} required min={100} max={1000} />
        </Field>

        {preview && (
          <Card className="text-sm text-slate-300">
            <p>
              Métabolisme total estimé : <strong className="text-slate-100">{preview.tdee} kcal/j</strong>
            </p>
            <p className="mt-1">
              Trajectoire théorique : objectif atteint en <strong className="text-slate-100">{preview.days} jours</strong>,
              soit le <strong className="text-sky-300">{formatDateFR(preview.date)}</strong>.
            </p>
          </Card>
        )}

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <Button type="submit" disabled={!previewValid}>
          Générer ma trajectoire
        </Button>
      </form>
    </div>
  )
}
