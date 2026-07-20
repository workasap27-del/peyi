import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { DailyEntry, Profile } from '../types'
import { todayISO } from './date'

/** 'loading' while the initial IndexedDB read is in flight, `null` once confirmed absent. */
export type ProfileState = Profile | null | 'loading'

export function useProfile(): ProfileState {
  return useLiveQuery<Profile | null, 'loading'>(
    async () => (await db.profile.orderBy('id').last()) ?? null,
    [],
    'loading',
  )
}

/** For pages mounted only once App.tsx has already confirmed a profile exists. */
export function useConfirmedProfile(): Profile | undefined {
  const state = useProfile()
  return state === 'loading' || state === null ? undefined : state
}

export function useEntries(): DailyEntry[] {
  return useLiveQuery(() => db.entries.orderBy('date').toArray(), []) ?? []
}

export function useTodayEntry(): DailyEntry | undefined {
  const today = todayISO()
  return useLiveQuery(() => db.entries.where('date').equals(today).first(), [today])
}
