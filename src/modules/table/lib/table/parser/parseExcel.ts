// Parses Excel (.xlsx / .xls) files via SheetJS (dynamic import).
// Returns the first sheet as string[][].
export async function parseExcel(buffer: ArrayBuffer): Promise<string[][]> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheet = workbook.SheetNames[0]
  if (!firstSheet) return []
  const ws = workbook.Sheets[firstSheet]
  if (!ws) return []
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })
  return raw.map((row) =>
    (row as unknown[]).map((cell) => (cell == null ? '' : String(cell)))
  )
}
