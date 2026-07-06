import { describe, it, expect } from 'vitest'
import { validate } from '../figureApi'
import type { FigureState } from '../../types/figures'

// validate() only reads `type`/`data`, so a minimal cast is enough — full
// per-type `params` aren't exercised by this function.
function fig(type: FigureState['type'], data: unknown): FigureState {
  return { id: 'x', type, data, params: {} } as unknown as FigureState
}

describe('validate', () => {
  describe('confusion_matrix', () => {
    it('rejects empty data', () => {
      expect(validate(fig('confusion_matrix', []))).toBe('データを入力してください')
    })

    it('rejects a non-square matrix', () => {
      expect(validate(fig('confusion_matrix', [[1, 2], [3, 4], [5, 6]]))).toBe('正方行列を入力してください')
    })

    it('accepts a square matrix', () => {
      expect(validate(fig('confusion_matrix', [[1, 2], [3, 4]]))).toBeNull()
    })
  })

  describe('heatmap', () => {
    it('rejects empty data', () => {
      expect(validate(fig('heatmap', []))).toBe('データを入力してください')
    })

    it('rejects rows of differing lengths', () => {
      expect(validate(fig('heatmap', [[1, 2, 3], [4, 5]]))).toBe('各行の長さが異なります')
    })

    it('accepts a rectangular (non-square is fine) matrix', () => {
      expect(validate(fig('heatmap', [[1, 2, 3], [4, 5, 6]]))).toBeNull()
    })
  })

  describe('bar_chart', () => {
    it('rejects when there are no labels', () => {
      expect(validate(fig('bar_chart', { labels: [], values: [] }))).toBe('ラベルを入力してください')
    })

    it('accepts when labels are present', () => {
      expect(validate(fig('bar_chart', { labels: ['human', 'goodbot', 'badbot'], values: [77, 15, 3] }))).toBeNull()
    })
  })

  describe('line_plot', () => {
    it('rejects empty x data', () => {
      expect(validate(fig('line_plot', { x: [], y: [] }))).toBe('データを入力してください')
    })

    it('accepts non-empty x data', () => {
      expect(validate(fig('line_plot', { x: [1, 2, 3], y: [1, 2, 3] }))).toBeNull()
    })
  })

  describe('scatter_plot', () => {
    it('rejects when there are no series', () => {
      expect(validate(fig('scatter_plot', { series: [] }))).toBe('データを入力してください')
    })

    it('accepts at least one series', () => {
      expect(validate(fig('scatter_plot', { series: [{ x: [1], y: [2] }] }))).toBeNull()
    })
  })

  describe('histogram', () => {
    it('rejects empty data', () => {
      expect(validate(fig('histogram', []))).toBe('データを入力してください')
    })

    it('accepts non-empty data', () => {
      expect(validate(fig('histogram', [1, 2, 3]))).toBeNull()
    })
  })

  describe('box_plot / violin_plot', () => {
    it('rejects when there are no groups', () => {
      expect(validate(fig('box_plot', { groups: [] }))).toBe('データを入力してください')
      expect(validate(fig('violin_plot', { groups: [] }))).toBe('データを入力してください')
    })

    it('rejects when the first group is empty', () => {
      expect(validate(fig('box_plot', { groups: [[]] }))).toBe('データを入力してください')
    })

    it('accepts at least one non-empty group', () => {
      expect(validate(fig('box_plot', { groups: [[1, 2, 3]] }))).toBeNull()
    })
  })

  describe('error_bar', () => {
    it('rejects when labels or series are missing', () => {
      expect(validate(fig('error_bar', { labels: [], series: [{ values: [1], errors: [0.1] }] }))).toBe('データを入力してください')
      expect(validate(fig('error_bar', { labels: ['a'], series: [] }))).toBe('データを入力してください')
    })

    it('accepts when both labels and series are present', () => {
      expect(validate(fig('error_bar', { labels: ['a'], series: [{ values: [1], errors: [0.1] }] }))).toBeNull()
    })
  })

  // These 8 figure types have no case in validate()'s switch — they always
  // pass regardless of data, unlike the 8 types above. Documented here so a
  // future validate() change that accidentally narrows/breaks this is caught.
  describe('types without dedicated validation (fall through to null)', () => {
    const unvalidatedTypes: FigureState['type'][] = [
      'roc_curve', 'pr_curve', 'learning_curve', 'feature_importance',
      'stacked_bar', 'combo_chart', 'pie_chart',
    ]
    it.each(unvalidatedTypes)('%s always returns null, even with empty-looking data', (type) => {
      expect(validate(fig(type, {}))).toBeNull()
    })
  })
})
