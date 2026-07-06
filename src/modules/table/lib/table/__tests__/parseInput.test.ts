import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseInput } from '../parser'

const FIXTURES = join(__dirname, '..', '..', '..', '..', '..', '..', 'test-data', 'table')

describe('parseInput', () => {
  it('returns null for unrecognized input', () => {
    expect(parseInput('')).toBeNull()
    expect(parseInput('just some free-form prose\nwith no delimiters at all')).toBeNull()
  })

  it('parses TSV text into a normalized TableModel', () => {
    const model = parseInput('Method\tAcc\nOurs\t0.92')
    expect(model).not.toBeNull()
    expect(model!.columns).toEqual(['Method', 'Acc'])
    expect(model!.rows).toHaveLength(2)
  })

  it('parses a CSV fixture file end-to-end', () => {
    const text = readFileSync(join(FIXTURES, 'main_table.csv'), 'utf-8')
    const model = parseInput(text)
    expect(model).not.toBeNull()
    expect(model!.columns).toEqual(['Method', 'Accuracy', 'Precision', 'F1'])
    expect(model!.rows).toHaveLength(4)
    expect(model!.rows[0]!.rowType).toBe('header')
  })

  it('parses a classification report end-to-end', () => {
    const report = [
      '              precision    recall  f1-score   support',
      '           0       0.85      0.88      0.86        50',
      '    accuracy                           0.88       153',
    ].join('\n')
    const model = parseInput(report)
    expect(model).not.toBeNull()
    expect(model!.columns).toEqual(['Class', 'Precision', 'Recall', 'F1-Score', 'Support'])
    expect(model!.rows.map((r) => r.cells[0]!.value)).toEqual(['Class', '0', 'accuracy'])
  })

  it('parses a training log end-to-end', () => {
    const log = ['Epoch: 10', 'Loss: 0.123', 'Accuracy: 0.95'].join('\n')
    const model = parseInput(log)
    expect(model).not.toBeNull()
    expect(model!.columns).toEqual(['Metric', 'Value'])
    expect(model!.rows).toHaveLength(4)
  })
})
