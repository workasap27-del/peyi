import Dexie, { type Table } from 'dexie'
import type { DailyEntry, Profile } from '../types'

export class PoidsDB extends Dexie {
  profile!: Table<Profile, number>
  entries!: Table<DailyEntry, number>

  constructor() {
    super('poids-pwa')
    this.version(1).stores({
      profile: '++id',
      entries: '++id, &date',
    })
  }
}

export const db = new PoidsDB()

export async function getProfile(): Promise<Profile | undefined> {
  return db.profile.orderBy('id').last()
}

export async function saveProfile(profile: Profile): Promise<void> {
  await db.profile.clear()
  await db.profile.add(profile)
}

export async function getAllEntries(): Promise<DailyEntry[]> {
  return db.entries.orderBy('date').toArray()
}

export async function getEntry(date: string): Promise<DailyEntry | undefined> {
  return db.entries.where('date').equals(date).first()
}

export async function upsertEntry(entry: DailyEntry): Promise<void> {
  const existing = await getEntry(entry.date)
  if (existing) {
    await db.entries.update(existing.id!, { ...entry, id: existing.id })
  } else {
    await db.entries.add(entry)
  }
}

export async function exportAllData(): Promise<{ profile: Profile | undefined; entries: DailyEntry[] }> {
  const [profile, entries] = await Promise.all([getProfile(), getAllEntries()])
  return { profile, entries }
}

export async function wipeAllData(): Promise<void> {
  await db.transaction('rw', db.profile, db.entries, async () => {
    await db.profile.clear()
    await db.entries.clear()
  })
}
