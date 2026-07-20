import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyEntry, Profile } from '../../types'
import { buildRealTrajectory, buildTheoreticalTrajectory } from '../../lib/calculations'
import { formatDateFR, toISODate, todayISO } from '../../lib/date'
import { Card } from '../ui/Field'

function toTimestamp(isoDate: string): number {
  return new Date(isoDate + 'T00:00:00').getTime()
}

export function ProgressChart({ profile, entries }: { profile: Profile; entries: DailyEntry[] }) {
  const data = useMemo(() => {
    const theoretical = buildTheoreticalTrajectory(profile)
    const real = buildRealTrajectory(profile, entries)
    const byDate = new Map<string, { t: number; theoreticalWeight?: number; realWeight?: number }>()

    for (const p of theoretical) {
      byDate.set(p.date, { t: toTimestamp(p.date), theoreticalWeight: p.theoreticalWeight })
    }
    for (const p of real) {
      const existing = byDate.get(p.date)
      if (existing) existing.realWeight = p.realWeight
      else byDate.set(p.date, { t: toTimestamp(p.date), realWeight: p.realWeight })
    }
    return Array.from(byDate.values()).sort((a, b) => a.t - b.t)
  }, [profile, entries])

  const today = todayISO()
  const todayTs = toTimestamp(today)

  return (
    <Card>
      <p className="mb-3 text-sm font-semibold text-slate-200">Trajectoire théorique vs réelle</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="t"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(t: number) => formatDateFR(toISODate(new Date(t))).slice(0, 5)}
              stroke="#64748b"
              fontSize={11}
              minTickGap={30}
            />
            <YAxis
              domain={['dataMin - 2', 'dataMax + 2']}
              stroke="#64748b"
              fontSize={11}
              width={40}
              tickFormatter={(v: number) => `${v.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }}
              labelFormatter={(t) => formatDateFR(toISODate(new Date(Number(t))))}
              formatter={(value, name) => [`${Number(value).toFixed(1)} kg`, String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine x={todayTs} stroke="#475569" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="theoreticalWeight"
              name="Théorique"
              stroke="#64748b"
              strokeDasharray="6 4"
              dot={false}
              strokeWidth={2}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="realWeight"
              name="Réel"
              stroke="#38bdf8"
              dot={{ r: 2 }}
              strokeWidth={2.5}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
