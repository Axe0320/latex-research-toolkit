import { parseCSV, parseTSV } from '../../../../../shared/lib/dataParsing'

/**
 * TSV/CSV → string[][] (trim済み). Delegates to shared/lib/dataParsing
 * (docs/02-integrations.md 連携#2) instead of Chart's own ad-hoc split, which
 * unlike the shared parser didn't handle quoted CSV fields containing commas.
 */
export function parseCsv(text: string): string[][] {
  const trimmed = text.trim()
  const rows = trimmed.includes('\t') ? parseTSV(trimmed) : parseCSV(trimmed)
  return rows
    .map((row) => row.map((c) => c.trim()))
    .filter((row) => row.some((c) => c !== ''))
}

/** セルを数値に変換。失敗したら NaN */
export function toNum(s: string): number {
  return parseFloat(s.replace(/,/g, ''))
}
