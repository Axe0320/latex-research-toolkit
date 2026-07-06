import { openDB, type IDBPDatabase } from 'idb'

// Single shared IndexedDB database for the whole app (see docs/01-architecture.md §2.4).
// Each module owns its own object store(s) below rather than opening a separate
// `indexedDB.open()` connection, which would otherwise race on version upgrades.
export const DB_NAME = 'academic-suite'
export const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

export function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tableSessions')) db.createObjectStore('tableSessions')
        // Add remaining stores here as each module migrates onto this shared
        // DB: citationLibrary, figures/layout/previews (Phase 4), clipboard (Phase 5).
      },
    })
  }
  return dbPromise
}

/**
 * Schema versioning convention (docs/01-architecture.md §2.4, modeled on
 * figure-modification's migrateFigures() precedent): every record persisted
 * through this module carries a `schemaVersion`. When a store's record shape
 * changes, add a migration step here instead of mutating old records in place.
 */
export interface VersionedRecord {
  schemaVersion: number
}

export function migrate<T extends VersionedRecord>(
  record: T,
  targetVersion: number,
  steps: Record<number, (record: T) => T>,
): T {
  let migrated = record
  let version = record.schemaVersion ?? 1
  while (version < targetVersion) {
    const step = steps[version]
    if (!step) break
    migrated = step(migrated)
    version += 1
  }
  return { ...migrated, schemaVersion: targetVersion }
}
