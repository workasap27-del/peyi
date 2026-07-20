export function todayISO(): string {
  return toISODate(new Date())
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function diffDays(fromISO: string, toISOStr: string): number {
  const a = new Date(fromISO + 'T00:00:00').getTime()
  const b = new Date(toISOStr + 'T00:00:00').getTime()
  return Math.round((b - a) / 86_400_000)
}

export function formatDateFR(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
