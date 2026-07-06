const HEADER = ['Class', 'Precision', 'Recall', 'F1-Score', 'Support']

export function parseClassificationReport(text: string): string[][] {
  const lines = text.split('\n')

  const headerIdx = lines.findIndex(
    (l) => /precision/i.test(l) && /recall/i.test(l)
  )
  if (headerIdx === -1) return []

  const rows: string[][] = [HEADER]

  for (const line of lines.slice(headerIdx + 1)) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const parsed = extractRow(trimmed)
    if (!parsed) continue

    rows.push(parsed)
  }

  return rows.length > 1 ? rows : []
}

// Extract label + numeric values from a single report line.
// Strategy: collect all number matches with their positions,
// then take the last 4 (normal row) or last 2 (accuracy row) as values.
// Everything before the first of those trailing numbers is the label.
//
// Examples:
//   "0       0.85  0.88  0.86  50"  → ['0','0.85','0.88','0.86','50']
//   "cat     0.50  0.50  0.50   2"  → ['cat','0.50','0.50','0.50','2']
//   "accuracy             0.88 153" → ['accuracy','','','0.88','153']
//   "macro avg  0.84 0.83 0.83 153" → ['macro avg','0.84','0.83','0.83','153']
function extractRow(line: string): string[] | null {
  const matches = [...line.matchAll(/\d+\.?\d*/g)]
  if (matches.length === 0) return null

  if (matches.length >= 4) {
    // Take last 4 numbers as [precision, recall, f1, support]
    const tail = matches.slice(-4)
    const labelEnd = tail[0]!.index!
    const label = line.slice(0, labelEnd).trim()
    if (!label) return null
    return [label, ...tail.map((m) => m[0])]
  }

  if (matches.length === 2) {
    // Accuracy row: only f1-score and support
    const tail = matches.slice(-2)
    const labelEnd = tail[0]!.index!
    const label = line.slice(0, labelEnd).trim()
    if (!label) return null
    return [label, '', '', tail[0]![0], tail[1]![0]]
  }

  return null
}
