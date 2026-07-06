import { describe, it, expect } from 'vitest'
import { detect } from '../parser/detect'

describe('detect', () => {
  it('returns unknown for empty/whitespace input', () => {
    expect(detect('')).toBe('unknown')
    expect(detect('   \n  ')).toBe('unknown')
  })

  it('detects tsv when a tab character is present', () => {
    expect(detect('a\tb\tc\n1\t2\t3')).toBe('tsv')
  })

  it('prioritizes tsv over csv when both a tab and commas are present', () => {
    expect(detect('a,b\tc\n1,2\t3')).toBe('tsv')
  })

  it('detects a classification report by its precision/recall/f1 header', () => {
    const report = [
      '              precision    recall  f1-score   support',
      '',
      '           0       0.85      0.88      0.86        50',
      '    accuracy                           0.88       153',
    ].join('\n')
    expect(detect(report)).toBe('classification-report')
  })

  it('detects a log by 3+ "Key: value" lines', () => {
    const log = ['Epoch: 10', 'Loss: 0.123', 'Accuracy: 0.95'].join('\n')
    expect(detect(log)).toBe('log')
  })

  it('does not misdetect 1-2 key/value lines as a log', () => {
    expect(detect('Epoch: 10\nLoss: 0.123')).toBe('unknown')
  })

  it('detects csv when comma count is consistent across all lines', () => {
    expect(detect('a,b,c\n1,2,3\n4,5,6')).toBe('csv')
  })

  it('does not detect csv when column counts are inconsistent', () => {
    expect(detect('a,b,c\n1,2')).toBe('unknown')
  })

  it('does not detect a single column (no commas) as csv', () => {
    expect(detect('a\nb\nc')).toBe('unknown')
  })
})
