// Parses HTML clipboard content for <table> elements only.
// HTML noise (div / meta / span) is ignored.
// Returns null if no <table> is found.
export function parseHTMLTable(html: string): string[][] | null {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const table = doc.querySelector('table')
    if (!table) return null

    const rows: string[][] = []
    for (const tr of table.querySelectorAll('tr')) {
      const cells: string[] = []
      for (const cell of tr.querySelectorAll('th, td')) {
        cells.push((cell as HTMLElement).textContent?.trim() ?? '')
      }
      if (cells.length > 0) rows.push(cells)
    }
    return rows.length > 0 ? rows : null
  } catch {
    return null
  }
}
