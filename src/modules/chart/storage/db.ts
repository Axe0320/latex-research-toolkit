import { getDB, migrate, type VersionedRecord } from '../../../shared/persistence'
import type { FigureState, ComposeLayout } from '../types/figures'

// `figures` intentionally does NOT use the schemaVersion/migrate() convention:
// FigureState is a large discriminated union (one variant per chart type)
// embedded throughout the module, so per-record versioning would mean adding
// schemaVersion to every variant for little benefit. Legacy-shape upgrades
// are instead detected structurally in figureStore.ts's migrateFigures()
// (e.g. `if (!('series' in d))`), which already covers the one shape change
// this store has needed so far.
export async function saveFigures(figures: FigureState[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('figures', 'readwrite')
  await tx.store.clear()
  await Promise.all(figures.map((f) => tx.store.put(f)))
  await tx.done
}

export async function loadFigures(): Promise<FigureState[]> {
  const db = await getDB()
  return db.getAll('figures')
}

const LAYOUT_SCHEMA_VERSION = 1

interface LayoutRecord extends VersionedRecord, ComposeLayout {}

export async function saveLayout(layout: ComposeLayout): Promise<void> {
  const db = await getDB()
  const record: LayoutRecord = { schemaVersion: LAYOUT_SCHEMA_VERSION, ...layout }
  await db.put('layout', record, 'current')
}

export async function loadLayout(): Promise<ComposeLayout | undefined> {
  const db = await getDB()
  const raw = await db.get('layout', 'current') as LayoutRecord | ComposeLayout | undefined
  if (!raw) return undefined
  // Pre-schemaVersion records were stored as a bare ComposeLayout.
  if (!('schemaVersion' in raw)) return raw
  const { schemaVersion: _schemaVersion, ...layout } = migrate(raw, LAYOUT_SCHEMA_VERSION, {})
  return layout
}

// `previews` also skips schemaVersion: each record is an opaque base64 image
// string with no structure to migrate.
export async function savePreview(id: string, b64: string): Promise<void> {
  const db = await getDB()
  await db.put('previews', b64, id)
}

export async function loadAllPreviews(ids: string[]): Promise<Record<string, string>> {
  const db = await getDB()
  const result: Record<string, string> = {}
  await Promise.all(
    ids.map(async (id) => {
      const b64 = await db.get('previews', id)
      if (b64) result[id] = b64
    }),
  )
  return result
}

export async function deletePreview(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('previews', id)
}
