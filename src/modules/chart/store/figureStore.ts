import { create } from 'zustand'
import type { FigureState, ComposeLayout } from '../types/figures'
import { DEFAULT_COMPOSE_LAYOUT } from '../types/figures'
import { saveFigures, loadFigures, saveLayout, loadLayout, loadAllPreviews } from '../storage/db'
import { setPreview as setCachePreview } from '../cache/previewCache'

interface FigureStore {
  figures: FigureState[]
  selectedId: string | null
  layout: ComposeLayout
  initialized: boolean
  addFigure:      (fig: FigureState) => void
  updateFigure:   (id: string, updater: (fig: FigureState) => FigureState) => void
  removeFigure:   (id: string) => void
  setSelectedId:  (id: string | null) => void
  setLayout:      (patch: Partial<ComposeLayout>) => void
  reorderFigures: (fromIdx: number, toIdx: number) => void
  initialize:     () => Promise<void>
}

// Migrate figures saved with old formats (e.g. scatter_plot {x,y} → {series:[{x,y}]})
function migrateFigures(figures: FigureState[]): FigureState[] {
  return figures.map((fig) => {
    if (fig.type === 'scatter_plot') {
      const d = fig.data as Record<string, unknown>
      if (!('series' in d)) {
        const x = (d.x as number[]) ?? []
        const y = (d.y as number[]) ?? []
        const p = fig.params as unknown as Record<string, unknown>
        return {
          ...fig,
          data: { series: [{ x, y }] },
          params: {
            ...fig.params,
            colors: [String(p.color ?? '#6C63FF')],
            legend: ['Series 1'],
            legend_loc: String(p.legend_loc ?? 'best'),
          },
        } as FigureState
      }
    }
    return fig
  })
}

export const useFigureStore = create<FigureStore>((set) => ({
  figures: [],
  selectedId: null,
  layout: DEFAULT_COMPOSE_LAYOUT,
  initialized: false,

  addFigure: (fig) =>
    set((s) => ({ figures: [...s.figures, fig] })),

  updateFigure: (id, updater) =>
    set((s) => ({ figures: s.figures.map((f) => f.id === id ? updater(f) : f) })),

  removeFigure: (id) =>
    set((s) => {
      const filtered = s.figures.filter((f) => f.id !== id)
      const newSelected = s.selectedId === id
        ? (filtered[filtered.length - 1]?.id ?? null)
        : s.selectedId
      return { figures: filtered, selectedId: newSelected }
    }),

  setSelectedId: (id) => set({ selectedId: id }),

  setLayout: (patch) =>
    set((s) => ({ layout: { ...s.layout, ...patch } })),

  reorderFigures: (fromIdx, toIdx) =>
    set((s) => {
      const next = [...s.figures]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return { figures: next }
    }),

  initialize: async () => {
    try {
      const [savedFigures, savedLayout] = await Promise.all([
        loadFigures(),
        loadLayout(),
      ])
      if (savedFigures.length > 0) {
        const migratedFigures = migrateFigures(savedFigures)
        const previews = await loadAllPreviews(migratedFigures.map((f) => f.id))
        Object.entries(previews).forEach(([id, b64]) => setCachePreview(id, b64))
        set({
          figures: migratedFigures,
          selectedId: savedFigures[0].id,
          layout: savedLayout ? { ...DEFAULT_COMPOSE_LAYOUT, ...savedLayout } : DEFAULT_COMPOSE_LAYOUT,
          initialized: true,
        })
      } else {
        set({ initialized: true })
      }
    } catch {
      set({ initialized: true })
    }
  },
}))

// Auto-save to IndexedDB whenever figures or layout change
useFigureStore.subscribe((state, prev) => {
  if (!state.initialized) return
  if (state.figures !== prev.figures) saveFigures(state.figures).catch(() => {})
  if (state.layout !== prev.layout) saveLayout(state.layout).catch(() => {})
})
