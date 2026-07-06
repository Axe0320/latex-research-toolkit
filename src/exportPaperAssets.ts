import JSZip from 'jszip'
import { getDB } from './shared/persistence'
import { loadTableSession } from './modules/table/persistence'
import { latexGenerator } from './modules/table/lib/table/generators/latexGenerator'
import { DEFAULT_OPTIONS } from './modules/table/lib/table/formatters/options'
import type { LibraryEntry } from './modules/citation/lib/library/types'
import type { FigureState } from './modules/chart/types/figures'

const CITATION_LIBRARY_KEY = 'entries'

/**
 * Reads across the three modules' own IndexedDB stores (citationLibrary,
 * tableSessions, figures/previews) and bundles them into one ZIP — the
 * "Export Paper Assets" linkage feature (docs/02-integrations.md 連携#4).
 * This orchestrator intentionally knows about each module's data shape, so
 * it lives at the app level rather than under shared/ (which stays
 * module-agnostic).
 */
export async function exportPaperAssets(): Promise<{ fileCount: number }> {
  const zip = new JSZip()
  const db = await getDB()
  let fileCount = 0

  const citationEntries = (await db.get('citationLibrary', CITATION_LIBRARY_KEY)) as LibraryEntry[] | undefined
  if (citationEntries?.length) {
    zip.file('references.bib', citationEntries.map((e) => e.raw).join('\n\n'))
    fileCount++
  }

  const tableSession = await loadTableSession()
  const nonEmptyTables = tableSession?.tables.filter((t) => t.rows.length > 0) ?? []
  if (nonEmptyTables.length > 0) {
    const tex = nonEmptyTables
      .map((t) => latexGenerator(t, DEFAULT_OPTIONS))
      .join('\n\n% --- table separator ---\n\n')
    zip.file('tables.tex', tex)
    fileCount++
  }

  const figures = (await db.getAll('figures')) as FigureState[]
  for (const [i, fig] of figures.entries()) {
    const b64 = (await db.get('previews', fig.id)) as string | undefined
    if (!b64) continue
    zip.file(`figures/${i + 1}_${fig.type}.png`, b64, { base64: true })
    fileCount++
  }

  if (fileCount === 0) return { fileCount: 0 }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'paper-assets.zip'
  a.click()
  URL.revokeObjectURL(url)

  return { fileCount }
}
