import { describe, it, expect } from 'vitest'
import { parseClassificationReport } from '../parser/parseClassificationReport'

describe('parseClassificationReport', () => {
  it('returns [] when no precision/recall header line is found', () => {
    expect(parseClassificationReport('just some text\nwith no header')).toEqual([])
  })

  it('parses a standard sklearn classification_report', () => {
    const report = [
      '              precision    recall  f1-score   support',
      '',
      '           0       0.85      0.88      0.86        50',
      '         cat       0.50      0.50      0.50         2',
      '',
      '    accuracy                           0.88       153',
      '   macro avg       0.84      0.83      0.83       153',
      'weighted avg       0.85      0.85      0.85       153',
    ].join('\n')

    expect(parseClassificationReport(report)).toEqual([
      ['Class', 'Precision', 'Recall', 'F1-Score', 'Support'],
      ['0', '0.85', '0.88', '0.86', '50'],
      ['cat', '0.50', '0.50', '0.50', '2'],
      ['accuracy', '', '', '0.88', '153'],
      ['macro avg', '0.84', '0.83', '0.83', '153'],
      ['weighted avg', '0.85', '0.85', '0.85', '153'],
    ])
  })

  it('returns [] when the header is found but no data rows follow', () => {
    expect(parseClassificationReport('precision recall f1-score support')).toEqual([])
  })
})
