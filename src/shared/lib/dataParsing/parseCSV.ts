export function parseCSV(text: string): string[][] {
  const rows: string[][] = []

  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    rows.push(splitCSVLine(line))
  }

  return rows
}

function splitCSVLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!

    if (ch === '"') {
      // Escaped quote inside quoted field
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += ch
    }
  }

  cells.push(current)
  return cells
}
