import { describe, it, expect } from 'vitest'
import { normalizeTable } from '../normalize/normalizeTable'

describe('normalizeTable', () => {
  it('returns an empty model for empty input', () => {
    const model = normalizeTable([])
    expect(model.columns).toEqual([])
    expect(model.rows).toEqual([])
  })

  it('returns an empty model when every row is blank', () => {
    const model = normalizeTable([['', ''], ['  ', '']])
    expect(model.rows).toEqual([])
  })

  it('marks the first row as header, centered and bold', () => {
    const model = normalizeTable([
      ['Method', 'Accuracy'],
      ['Ours', '0.92'],
    ])
    expect(model.rows[0]!.rowType).toBe('header')
    expect(model.rows[0]!.separatorBottom).toBe(true)
    expect(model.rows[0]!.cells.every((c) => c.bold && c.align === 'center')).toBe(true)
    expect(model.rows[1]!.rowType).toBe('normal')
    expect(model.columns).toEqual(['Method', 'Accuracy'])
  })

  it('right-aligns columns that are majority numeric, left-aligns the rest', () => {
    const model = normalizeTable([
      ['Method', 'Accuracy'],
      ['Ours', '0.92'],
      ['Baseline', '0.87'],
    ])
    const [methodCell, accCell] = model.rows[1]!.cells
    expect(methodCell!.align).toBe('left')
    expect(accCell!.align).toBe('right')
  })

  it('pads short rows to the max column count', () => {
    const model = normalizeTable([
      ['A', 'B', 'C'],
      ['1', '2'],
    ])
    expect(model.rows[1]!.cells).toHaveLength(3)
    expect(model.rows[1]!.cells[2]!.value).toBe('')
  })

  it('trims trailing columns that are empty in every row', () => {
    const model = normalizeTable([
      ['A', 'B', ''],
      ['1', '2', ''],
    ])
    expect(model.columns).toEqual(['A', 'B'])
    expect(model.rows[0]!.cells).toHaveLength(2)
  })

  it('trims whitespace from cell values', () => {
    const model = normalizeTable([[' A ', ' B '], [' 1 ', ' 2 ']])
    expect(model.columns).toEqual(['A', 'B'])
  })

  it('gives every row and cell a unique id', () => {
    const model = normalizeTable([
      ['A', 'B'],
      ['1', '2'],
    ])
    const ids = [
      model.rows[0]!.id,
      model.rows[1]!.id,
      ...model.rows[0]!.cells.map((c) => c.id),
      ...model.rows[1]!.cells.map((c) => c.id),
    ]
    expect(new Set(ids).size).toBe(ids.length)
  })
})
