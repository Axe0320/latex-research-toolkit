export type InputFormat = 'tsv' | 'classification-report' | 'log' | 'csv' | 'unknown'

export function detect(text: string): InputFormat {
  if (!text.trim()) return 'unknown'

  // TSV priority: any tab character present
  if (text.includes('\t')) return 'tsv'

  // Classification report: contains "precision" and "recall" and "f1-score" on the same line
  const hasReportHeader = text
    .split('\n')
    .some((l) => /precision/i.test(l) && /recall/i.test(l) && /f1/i.test(l))
  if (hasReportHeader) return 'classification-report'

  // Log: 3+ lines matching "Key: numeric_value" pattern
  const logLines = text
    .split('\n')
    .filter((l) => /^[\w][\w\s\-]*:\s*[\d]/.test(l.trim()))
  if (logLines.length >= 3) return 'log'

  // CSV: comma-separated with consistent column count
  const lines = text.trim().split('\n').filter((l) => l.trim())
  if (lines.length >= 1 && lines[0]!.includes(',')) {
    const colCounts = lines.map((l) => l.split(',').length)
    const allSame = colCounts.every((c) => c === colCounts[0])
    if (allSame && colCounts[0]! > 1) return 'csv'
  }

  return 'unknown'
}
