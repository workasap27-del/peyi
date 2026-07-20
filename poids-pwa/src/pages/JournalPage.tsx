import { useEffect, useState } from 'react'
import { getEntry, upsertEntry } from '../db/db'
import { todayISO } from '../lib/date'
import type { Activity, DailyEntry, Meal } from '../types'
import { Button, Card, Field, TextInput } from '../components/ui/Field'
import { ItemList, type NamedCalorieItem } from '../components/journal/ItemList'

const emptyEntry = (date: string): DailyEntry => ({
  date,
  meals: [],
  activitiesOut: [],
  updatedAt: new Date().toISOString(),
})

export function JournalPage() {
  const [date, setDate] = useState(todayISO())
  const [weightKg, setWeightKg] = useState('')
  const [manualCaloriesIn, setManualCaloriesIn] = useState('')
  const [meals, setMeals] = useState<Meal[]>([])
  const [activitiesOut, setActivitiesOut] = useState<Activity[]>([])
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setSaved(false)
    getEntry(date).then((entry) => {
      setWeightKg(entry?.weightKg != null ? String(entry.weightKg) : '')
      setMeals(entry?.meals ?? [])
      setActivitiesOut(entry?.activitiesOut ?? [])
      setManualCaloriesIn(
        entry?.caloriesIn != null && (entry.meals ?? []).length === 0 ? String(entry.caloriesIn) : '',
      )
      setLoaded(true)
    })
  }, [date])

  const mealsTotal = meals.reduce((s, m) => s + m.calories, 0)
  const caloriesIn = meals.length > 0 ? mealsTotal : manualCaloriesIn ? Number(manualCaloriesIn) : undefined

  async function handleSave() {
    const base = await getEntry(date)
    const entry: DailyEntry = {
      ...(base ?? emptyEntry(date)),
      date,
      weightKg: weightKg ? Number(weightKg) : undefined,
      caloriesIn,
      meals,
      activitiesOut,
      updatedAt: new Date().toISOString(),
    }
    await upsertEntry(entry)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!loaded) return null

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6 pb-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-50">Journal</h1>
        <input
          type="date"
          value={date}
          max={todayISO()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1.5 text-sm text-slate-200"
        />
      </header>

      <Card>
        <Field label="Poids du matin (kg)" hint="Optionnel — affine la tendance lissée.">
          <TextInput
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="ex : 96.4"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </Field>
      </Card>

      <Card>
        <p className="mb-2 text-sm font-semibold text-slate-200">Apports (repas)</p>
        <ItemList items={meals as NamedCalorieItem[]} onChange={(items) => setMeals(items as Meal[])} namePlaceholder="ex : Menu McDo" />
        {meals.length === 0 && (
          <div className="mt-3 border-t border-slate-800 pt-3">
            <Field label="Ou saisir directement le total calorique du jour">
              <TextInput
                type="number"
                inputMode="numeric"
                placeholder="ex : 1800"
                value={manualCaloriesIn}
                onChange={(e) => setManualCaloriesIn(e.target.value)}
              />
            </Field>
          </div>
        )}
      </Card>

      <Card>
        <p className="mb-2 text-sm font-semibold text-slate-200">Sport & activité</p>
        <ItemList
          items={activitiesOut as NamedCalorieItem[]}
          onChange={(items) => setActivitiesOut(items as Activity[])}
          namePlaceholder="ex : Course à pied"
          showDuration
        />
      </Card>

      <Button onClick={handleSave}>{saved ? '✓ Enregistré' : 'Enregistrer la journée'}</Button>
    </div>
  )
}
