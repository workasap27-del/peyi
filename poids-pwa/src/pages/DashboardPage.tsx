import { useMemo } from 'react'
import { useConfirmedProfile, useEntries, useTodayEntry } from '../lib/hooks'
import { computeProjection } from '../lib/calculations'
import { KpiCards } from '../components/dashboard/KpiCards'
import { ProgressChart } from '../components/dashboard/ProgressChart'
import { InstallButton } from '../components/layout/InstallButton'
import { formatDateFR } from '../lib/date'

export function DashboardPage() {
  const profile = useConfirmedProfile()
  const entries = useEntries()
  const todayEntry = useTodayEntry()

  const projection = useMemo(() => {
    if (!profile) return null
    return computeProjection(profile, entries)
  }, [profile, entries])

  if (!profile || !projection) return null

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-50">Ta trajectoire</h1>
          <p className="text-xs text-slate-500">
            Départ le {formatDateFR(profile.startDate)} · objectif théorique {formatDateFR(projection.theoreticalDate)}
          </p>
        </div>
      </header>

      <KpiCards profile={profile} projection={projection} todayEntry={todayEntry} />
      <ProgressChart profile={profile} entries={entries} />
      <InstallButton />
    </div>
  )
}
