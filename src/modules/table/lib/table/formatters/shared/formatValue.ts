import type { FormattingOptions } from '../options'

export function formatValue(raw: string, opts: FormattingOptions): string {
  const trimmed = raw.trim()

  if (trimmed === '') {
    return opts.missingValue === 'blank' ? '' : opts.missingValue
  }

  const num = Number(trimmed)
  if (isFinite(num)) {
    if (opts.decimalPrecision === 'auto') {
      // Auto: apply 4 decimal places only if value has a decimal point
      return trimmed.includes('.') ? num.toFixed(4) : trimmed
    }
    return num.toFixed(opts.decimalPrecision)
  }

  return trimmed
}
