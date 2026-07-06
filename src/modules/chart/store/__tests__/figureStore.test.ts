import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFigureStore, migrateFigures } from '../figureStore'
import { DEFAULT_COMPOSE_LAYOUT } from '../../types/figures'
import type { FigureState } from '../../types/figures'

vi.mock('../../storage/db', () => ({
  saveFigures: vi.fn().mockResolvedValue(undefined),
  loadFigures: vi.fn().mockResolvedValue([]),
  saveLayout: vi.fn().mockResolvedValue(undefined),
  loadLayout: vi.fn().mockResolvedValue(undefined),
  loadAllPreviews: vi.fn().mockResolvedValue({}),
}))

function makeFigure(id: string): FigureState {
  return {
    id,
    type: 'bar_chart',
    data: { labels: ['a'], values: [1] },
    params: {},
  } as unknown as FigureState
}

describe('useFigureStore', () => {
  beforeEach(() => {
    useFigureStore.setState({ figures: [], selectedId: null, initialized: false, layout: DEFAULT_COMPOSE_LAYOUT })
  })

  it('addFigure appends to the figures array', () => {
    const fig = makeFigure('1')
    useFigureStore.getState().addFigure(fig)
    expect(useFigureStore.getState().figures).toEqual([fig])
  })

  it('updateFigure applies the updater only to the matching id', () => {
    useFigureStore.getState().addFigure(makeFigure('1'))
    useFigureStore.getState().addFigure(makeFigure('2'))
    useFigureStore.getState().updateFigure('2', (f) => ({ ...f, data: { labels: ['x'], values: [9] } }) as FigureState)
    const figures = useFigureStore.getState().figures
    expect(figures[0]!.data).toEqual({ labels: ['a'], values: [1] })
    expect(figures[1]!.data).toEqual({ labels: ['x'], values: [9] })
  })

  describe('removeFigure', () => {
    it('removes the figure with the matching id', () => {
      useFigureStore.getState().addFigure(makeFigure('1'))
      useFigureStore.getState().addFigure(makeFigure('2'))
      useFigureStore.getState().removeFigure('1')
      expect(useFigureStore.getState().figures.map((f) => f.id)).toEqual(['2'])
    })

    it('falls back selectedId to the last remaining figure when the selected one is removed', () => {
      useFigureStore.getState().addFigure(makeFigure('1'))
      useFigureStore.getState().addFigure(makeFigure('2'))
      useFigureStore.setState({ selectedId: '1' })
      useFigureStore.getState().removeFigure('1')
      expect(useFigureStore.getState().selectedId).toBe('2')
    })

    it('keeps selectedId unchanged when removing a non-selected figure', () => {
      useFigureStore.getState().addFigure(makeFigure('1'))
      useFigureStore.getState().addFigure(makeFigure('2'))
      useFigureStore.setState({ selectedId: '2' })
      useFigureStore.getState().removeFigure('1')
      expect(useFigureStore.getState().selectedId).toBe('2')
    })

    it('sets selectedId to null when the last figure is removed', () => {
      useFigureStore.getState().addFigure(makeFigure('1'))
      useFigureStore.setState({ selectedId: '1' })
      useFigureStore.getState().removeFigure('1')
      expect(useFigureStore.getState().selectedId).toBeNull()
    })
  })

  it('reorderFigures moves a figure from one index to another', () => {
    useFigureStore.getState().addFigure(makeFigure('1'))
    useFigureStore.getState().addFigure(makeFigure('2'))
    useFigureStore.getState().addFigure(makeFigure('3'))
    useFigureStore.getState().reorderFigures(0, 2)
    expect(useFigureStore.getState().figures.map((f) => f.id)).toEqual(['2', '3', '1'])
  })

  it('setLayout merges the patch into the existing layout', () => {
    const before = useFigureStore.getState().layout
    useFigureStore.getState().setLayout({ gap: 99 })
    expect(useFigureStore.getState().layout).toEqual({ ...before, gap: 99 })
  })
})

describe('migrateFigures', () => {
  it('leaves non-scatter figures untouched', () => {
    const fig = makeFigure('1')
    expect(migrateFigures([fig])).toEqual([fig])
  })

  it('leaves already-migrated scatter_plot figures (with `series`) untouched', () => {
    const fig = {
      id: '1', type: 'scatter_plot',
      data: { series: [{ x: [1], y: [2] }] },
      params: {},
    } as unknown as FigureState
    expect(migrateFigures([fig])).toEqual([fig])
  })

  it('upgrades a legacy scatter_plot {x,y} shape into {series:[{x,y}]}', () => {
    const legacy = {
      id: '1', type: 'scatter_plot',
      data: { x: [1, 2], y: [3, 4] },
      params: { color: '#ff0000', legend_loc: 'upper left' },
    } as unknown as FigureState

    const [migrated] = migrateFigures([legacy])
    expect(migrated!.data).toEqual({ series: [{ x: [1, 2], y: [3, 4] }] })
    expect((migrated!.params as unknown as Record<string, unknown>).colors).toEqual(['#ff0000'])
    expect((migrated!.params as unknown as Record<string, unknown>).legend).toEqual(['Series 1'])
    expect((migrated!.params as unknown as Record<string, unknown>).legend_loc).toBe('upper left')
  })

  it('defaults color/legend_loc when migrating a legacy scatter_plot with no prior color set', () => {
    const legacy = {
      id: '1', type: 'scatter_plot',
      data: { x: [], y: [] },
      params: {},
    } as unknown as FigureState

    const [migrated] = migrateFigures([legacy])
    expect((migrated!.params as unknown as Record<string, unknown>).colors).toEqual(['#6C63FF'])
    expect((migrated!.params as unknown as Record<string, unknown>).legend_loc).toBe('best')
  })
})
