import { describe, it, expect } from 'vitest'
import { parseLog } from '../parser/parseLog'

describe('parseLog', () => {
  it('returns [] when there are no key: value lines', () => {
    expect(parseLog('just some free text')).toEqual([])
  })

  it('parses Key: value lines into a Metric/Value table', () => {
    const log = ['Epoch: 10', 'Loss: 0.123', 'Accuracy: 0.95'].join('\n')
    expect(parseLog(log)).toEqual([
      ['Metric', 'Value'],
      ['Epoch', '10'],
      ['Loss', '0.123'],
      ['Accuracy', '0.95'],
    ])
  })

  it('keeps non-numeric-looking values such as fractions intact', () => {
    expect(parseLog('Epoch: 10/50')).toEqual([
      ['Metric', 'Value'],
      ['Epoch', '10/50'],
    ])
  })

  it('ignores lines that do not match the key: value pattern', () => {
    const log = ['Starting training...', 'Loss: 0.5', '=== done ==='].join('\n')
    expect(parseLog(log)).toEqual([
      ['Metric', 'Value'],
      ['Loss', '0.5'],
    ])
  })
})
