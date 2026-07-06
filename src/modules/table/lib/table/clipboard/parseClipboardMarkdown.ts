// Parses Markdown table format from clipboard text.
// | A | B |     ← data row
// |---|---|     ← separator (skipped)
// | 1 | 2 |    ← data row
// Returns null if the text is not a Markdown table.
export function parseClipboardMarkdown(text: string): string[][] | null {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return null

  // First line must start with |
  if (!lines[0]!.trim().startsWith('|')) return null

  // Second line must be a separator row (|---|:---:|---|)
  const sep = lines[1]!.trim()
  if (!/^\|[\s\-:|]+\|$/.test(sep)) return null

  const rows: string[][] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) continue
    // Skip separator lines
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue

    const cells = trimmed.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.length > 0) rows.push(cells)
  }

  return rows.length > 0 ? rows : null
}
