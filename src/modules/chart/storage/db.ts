import { getDB } from '../../../shared/persistence'
import type { FigureState, ComposeLayout } from '../types/figures'

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

export async function saveLayout(layout: ComposeLayout): Promise<void> {
  const db = await getDB()
  await db.put('layout', layout, 'current')
}

export async function loadLayout(): Promise<ComposeLayout | undefined> {
  const db = await getDB()
  return db.get('layout', 'current')
}

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
