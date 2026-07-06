const KEY_VALUE = /^([\w][\w\s\-]*):\s*(.+)$/

export function parseLog(text: string): string[][] {
  const rows: string[][] = [['Metric', 'Value']]

  for (const line of text.split('\n')) {
    const match = line.trim().match(KEY_VALUE)
    if (!match) continue

    const key = match[1]!.trim()
    const value = match[2]!.trim()

    // Skip non-numeric values (e.g. "Epoch: 10/50" contains "/" — still valid)
    rows.push([key, value])
  }

  return rows.length > 1 ? rows : []
}
