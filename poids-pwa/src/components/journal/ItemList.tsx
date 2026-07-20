import { useState } from 'react'
import { Button, TextInput } from '../ui/Field'

export interface NamedCalorieItem {
  name: string
  calories: number
  durationMin?: number
}

export function ItemList({
  items,
  onChange,
  namePlaceholder,
  showDuration = false,
}: {
  items: NamedCalorieItem[]
  onChange: (items: NamedCalorieItem[]) => void
  namePlaceholder: string
  showDuration?: boolean
}) {
  const [name, setName] = useState('')
  const [calories, setCalories] = useState('')
  const [duration, setDuration] = useState('')

  function addItem() {
    const cal = Number(calories)
    if (!name.trim() || !Number.isFinite(cal) || cal <= 0) return
    const item: NamedCalorieItem = { name: name.trim(), calories: cal }
    if (showDuration && duration) item.durationMin = Number(duration)
    onChange([...items, item])
    setName('')
    setCalories('')
    setDuration('')
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  const total = items.reduce((s, i) => s + i.calories, 0)

  return (
    <div className="flex flex-col gap-2">
      {items.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg bg-slate-800/70 px-3 py-2 text-sm text-slate-200"
            >
              <span>
                {item.name}
                {item.durationMin ? ` · ${item.durationMin} min` : ''}
              </span>
              <span className="flex items-center gap-3">
                <span className="font-medium text-slate-100">{item.calories} kcal</span>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-slate-500 hover:text-rose-400"
                  aria-label="Supprimer"
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
          <li className="px-3 text-right text-xs text-slate-500">Total : {total} kcal</li>
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <TextInput
          placeholder={namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-2">
          <TextInput
            type="number"
            inputMode="numeric"
            placeholder="kcal"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="w-auto! min-w-0 flex-1"
          />
          {showDuration && (
            <TextInput
              type="number"
              inputMode="numeric"
              placeholder="min"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-20! min-w-0 flex-none"
            />
          )}
          <Button type="button" variant="secondary" onClick={addItem} className="flex-none px-4">
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  )
}
