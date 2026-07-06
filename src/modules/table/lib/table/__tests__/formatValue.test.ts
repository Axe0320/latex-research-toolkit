import { describe, it, expect } from 'vitest'
import { formatValue } from '../formatters/shared/formatValue'
import { DEFAULT_OPTIONS, type FormattingOptions } from '../formatters/options'

describe('formatValue', () => {
  it('replaces blank values with the missing-value placeholder', () => {
    expect(formatValue('', { ...DEFAULT_OPTIONS, missingValue: '---' })).toBe('---')
    expect(formatValue('   ', { ...DEFAULT_OPTIONS, missingValue: 'N/A' })).toBe('N/A')
  })

  it('leaves blank values blank when missingValue is "blank"', () => {
    expect(formatValue('', { ...DEFAULT_OPTIONS, missingValue: 'blank' })).toBe('')
  })

  it('passes non-numeric text through unchanged', () => {
    expect(formatValue('Ours', DEFAULT_OPTIONS)).toBe('Ours')
  })

  describe('decimalPrecision: "auto"', () => {
    const opts: FormattingOptions = { ...DEFAULT_OPTIONS, decimalPrecision: 'auto' }

    it('pads decimal numbers to 4 places', () => {
      expect(formatValue('0.92', opts)).toBe('0.9200')
    })

    it('leaves integers (no decimal point) untouched', () => {
      expect(formatValue('50', opts)).toBe('50')
    })
  })

  describe('decimalPrecision: fixed number', () => {
    it('formats to the requested number of decimal places, integers included', () => {
      const opts: FormattingOptions = { ...DEFAULT_OPTIONS, decimalPrecision: 2 }
      expect(formatValue('0.9', opts)).toBe('0.90')
      expect(formatValue('50', opts)).toBe('50.00')
    })

    it('rounds rather than truncates', () => {
      const opts: FormattingOptions = { ...DEFAULT_OPTIONS, decimalPrecision: 2 }
      expect(formatValue('0.9261', opts)).toBe('0.93')
    })
  })
})
