import { getDB, migrate, type VersionedRecord } from '../../../../shared/persistence'
import type { LibraryEntry } from './types'

const KEY = 'entries'
const SCHEMA_VERSION = 1

interface LibraryRecord extends VersionedRecord {
  entries: LibraryEntry[]
}

export async function load(): Promise<LibraryEntry[]> {
  const db = await getDB()
  const raw = await db.get('citationLibrary', KEY) as LibraryRecord | LibraryEntry[] | undefined
  if (!raw) return []
  // Pre-schemaVersion records were stored as a bare array.
  if (Array.isArray(raw)) return raw
  return migrate(raw, SCHEMA_VERSION, {}).entries
}

export async function save(lib: LibraryEntry[]): Promise<void> {
  const db = await getDB()
  const record: LibraryRecord = { schemaVersion: SCHEMA_VERSION, entries: lib }
  await db.put('citationLibrary', record, KEY)
}

export function mergeReplace(
  current: LibraryEntry[],
  incoming: LibraryEntry[],
): { merged: LibraryEntry[]; replaced: number } {
  const map = new Map(current.map(e => [e.key, e]))
  let replaced = 0
  for (const e of incoming) {
    if (map.has(e.key)) replaced++
    map.set(e.key, e)
  }
  return { merged: [...map.values()], replaced }
}
