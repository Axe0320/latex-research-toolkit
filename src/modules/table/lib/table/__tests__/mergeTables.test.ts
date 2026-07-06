import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { appendRows, appendColumns, replaceWith } from '../merge/mergeTables'
import { normalizeTable } from '../normalize/normalizeTable'
import { parseCSV } from '../../../../../shared/lib/dataParsing'
import type { TableModel } from '../types'

const FIXTURES = join(__dirname, 'fixtures')

function loadFixture(name: string): TableModel {
  const text = readFileSync(join(FIXTURES, name), 'utf-8')
  return normalizeTable(parseCSV(text))
}

describe('mergeTables (using latex-table-composer sample data)', () => {
  const main = () => loadFixture('main_table.csv')
  const appendRowsSource = () => loadFixture('append_rows.csv')
  const appendColumnsSource = () => loadFixture('append_columns.csv')
  const replaceTarget = () => loadFixture('replace_target.csv')

  describe('appendRows', () => {
    it('appends only the data rows (not the header) from the source, below the primary', () => {
      const result = appendRows(main(), appendRowsSource())
      // main has 1 header + 3 data rows; source contributes its 2 data rows (header dropped)
      expect(result.rows).toHaveLength(4 + 2)
      const values = result.rows.map((r) => r.cells.map((c) => c.value))
      expect(values).toEqual([
        ['Method', 'Accuracy', 'Precision', 'F1'],
        ['Ours', '0.924', '0.918', '0.911'],
        ['BERT', '0.901', '0.895', '0.887'],
        ['Baseline', '0.872', '0.864', '0.859'],
        ['GPT-4', '0.951', '0.947', '0.943'],
        ['RoBERTa', '0.933', '0.928', '0.921'],
      ])
    })

    it('gives every appended row/cell a fresh id, distinct from the source model', () => {
      const source = appendRowsSource()
      const result = appendRows(main(), source)
      const appendedRow = result.rows[result.rows.length - 1]!
      const sourceDataRow = source.rows[source.rows.length - 1]!
      expect(appendedRow.id).not.toBe(sourceDataRow.id)
      expect(appendedRow.cells[0]!.id).not.toBe(sourceDataRow.cells[0]!.id)
    })

    it('uses the full source (header included) as the base when primary is empty', () => {
      const empty: TableModel = { ...main(), rows: [] }
      const result = appendRows(empty, appendRowsSource())
      expect(result.rows.map((r) => r.cells.map((c) => c.value))).toEqual([
        ['Method', 'Accuracy', 'Precision', 'F1'],
        ['GPT-4', '0.951', '0.947', '0.943'],
        ['RoBERTa', '0.933', '0.928', '0.921'],
      ])
    })

    it('pads a narrower source row up to the primary column count', () => {
      const narrowSource = normalizeTable(parseCSV('X\nonly-one-col'))
      const result = appendRows(main(), narrowSource)
      const lastRow = result.rows[result.rows.length - 1]!
      expect(lastRow.cells).toHaveLength(4)
      expect(lastRow.cells.map((c) => c.value)).toEqual(['only-one-col', '', '', ''])
    })
  })

  describe('appendColumns', () => {
    it('appends source columns to each primary row by matching row type/index', () => {
      const result = appendColumns(main(), appendColumnsSource())
      const values = result.rows.map((r) => r.cells.map((c) => c.value))
      expect(values).toEqual([
        ['Method', 'Accuracy', 'Precision', 'F1', 'Recall', 'AUC'],
        ['Ours', '0.924', '0.918', '0.911', '0.905', '0.961'],
        ['BERT', '0.901', '0.895', '0.887', '0.881', '0.942'],
        ['Baseline', '0.872', '0.864', '0.859', '0.857', '0.918'],
      ])
    })

    it('updates model.columns to include the newly appended header names', () => {
      const result = appendColumns(main(), appendColumnsSource())
      expect(result.columns).toEqual(['Method', 'Accuracy', 'Precision', 'F1', 'Recall', 'AUC'])
    })

    it('pads with empty cells when the source has fewer data rows than the primary', () => {
      const shortSource = normalizeTable(parseCSV('Extra\nonly-one-value'))
      const result = appendColumns(main(), shortSource)
      // main has 3 data rows, source has only 1 — rows 2 and 3 get an empty Extra cell
      expect(result.rows[2]!.cells[result.rows[2]!.cells.length - 1]!.value).toBe('')
      expect(result.rows[3]!.cells[result.rows[3]!.cells.length - 1]!.value).toBe('')
    })

    it('adds extra rows when the source has more data rows than the primary', () => {
      const longSource = normalizeTable(
        parseCSV('Extra\nrow1\nrow2\nrow3\nrow4'), // 4 data rows vs main's 3
      )
      const result = appendColumns(main(), longSource)
      expect(result.rows).toHaveLength(main().rows.length + 1) // one extra row added
      const extraRow = result.rows[result.rows.length - 1]!
      // Primary-side columns of the extra row are blank-padded
      expect(extraRow.cells.slice(0, 4).every((c) => c.value === '')).toBe(true)
      expect(extraRow.cells[4]!.value).toBe('row4')
    })

    it('uses the full source as the base when primary is empty', () => {
      const empty: TableModel = { ...main(), rows: [] }
      const result = appendColumns(empty, appendColumnsSource())
      expect(result.columns).toEqual(['Recall', 'AUC'])
    })
  })

  describe('replaceWith', () => {
    it('returns the source model verbatim (values), with fresh row/cell ids', () => {
      const source = replaceTarget()
      const result = replaceWith(source)
      expect(result.rows.map((r) => r.cells.map((c) => c.value))).toEqual(
        source.rows.map((r) => r.cells.map((c) => c.value)),
      )
      expect(result.rows[0]!.id).not.toBe(source.rows[0]!.id)
      expect(result.rows[0]!.cells[0]!.id).not.toBe(source.rows[0]!.cells[0]!.id)
    })
  })
})
