import { getDB } from '../../../../shared/persistence'
import type { LibraryEntry } from './types'

const KEY = 'entries'

export async function load(): Promise<LibraryEntry[]> {
  const db = await getDB()
  return (await db.get('citationLibrary', KEY)) ?? []
}

export async function save(lib: LibraryEntry[]): Promise<void> {
  const db = await getDB()
  await db.put('citationLibrary', lib, KEY)
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
